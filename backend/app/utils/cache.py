import redis
from typing import Optional, Any
import json
import pickle
from functools import wraps
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

# Redis client (singleton)
_redis_client: Optional[redis.Redis] = None


def reset_redis_client():
    """Force reset Redis client connection"""
    global _redis_client
    if _redis_client:
        try:
            _redis_client.close()
        except:
            pass
    _redis_client = None
    logger.info("🔄 Redis client reset")


def get_redis_client() -> Optional[redis.Redis]:
    """Get Redis client singleton with health check"""
    global _redis_client
    
    if _redis_client is None:
        try:
            redis_url = getattr(settings, 'REDIS_URL', None)
            if redis_url:
                _redis_client = redis.from_url(
                    redis_url,
                    decode_responses=False,  # We'll handle encoding
                    socket_connect_timeout=5,
                    socket_timeout=5,
                    health_check_interval=30,  # Check connection health every 30s
                    retry_on_timeout=True,
                    max_connections=50
                )
                # Test connection
                _redis_client.ping()
                logger.info("Redis connection established")
            else:
                logger.info("Redis URL not configured, caching disabled")
        except Exception as e:
            logger.warning(f"Failed to connect to Redis: {e}. Caching disabled.")
            _redis_client = None
    else:
        # Health check for existing connection
        try:
            _redis_client.ping()
        except Exception as e:
            logger.warning(f"Redis connection lost: {e}. Reconnecting...")
            _redis_client = None
            return get_redis_client()  # Recursive retry
    
    return _redis_client


def cache_result(key_prefix: str, ttl: int = 300):
    """
    Decorator to cache function results in Redis
    
    Args:
        key_prefix: Prefix for cache key
        ttl: Time to live in seconds (default: 5 minutes)
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            redis_client = get_redis_client()
            
            # If Redis not available, just call function
            if redis_client is None:
                return func(*args, **kwargs)
            
            # Build cache key from function args
            cache_key = f"{key_prefix}:{_build_cache_key(*args, **kwargs)}"
            
            try:
                # Try to get from cache
                cached = redis_client.get(cache_key)
                if cached:
                    logger.debug(f"Cache hit: {cache_key}")
                    return pickle.loads(cached)
                
                # Cache miss, call function
                logger.debug(f"Cache miss: {cache_key}")
                result = func(*args, **kwargs)
                
                # Store in cache
                try:
                    redis_client.setex(
                        cache_key,
                        ttl,
                        pickle.dumps(result)
                    )
                    logger.debug(f"✅ Cached result: {cache_key}")
                except redis.exceptions.ReadOnlyError as e:
                    logger.error(f"🔴 Redis READ-ONLY error on setex: {e}")
                    reset_redis_client()
                except Exception as set_err:
                    if "READONLY" in str(set_err).upper() or "read only" in str(set_err).lower():
                        logger.error(f"🔴 Detected READ-ONLY in setex: {set_err}")
                        reset_redis_client()
                    else:
                        logger.warning(f"Failed to cache result: {set_err}")
                
                return result
                
            except Exception as e:
                logger.warning(f"Cache error: {e}. Falling back to direct call.")
                if "READONLY" in str(e).upper() or "read only" in str(e).lower():
                    logger.error(f"🔴 READ-ONLY detected in decorator: {e}")
                    reset_redis_client()
                return func(*args, **kwargs)
        
        return wrapper
    return decorator


def invalidate_cache(pattern: str):
    """
    Delete cache keys matching pattern
    
    Args:
        pattern: Pattern to match (e.g., "teacher_stats:*")
    """
    redis_client = get_redis_client()
    
    if redis_client is None:
        return
    
    try:
        keys = redis_client.keys(pattern)
        if keys:
            redis_client.delete(*keys)
            logger.info(f"Invalidated {len(keys)} cache keys matching '{pattern}'")
    except Exception as e:
        logger.warning(f"Failed to invalidate cache: {e}")


def _build_cache_key(*args, **kwargs) -> str:
    """Build cache key from function arguments"""
    key_parts = []
    
    # Add args (skip first arg if it's 'self' or db session)
    for arg in args:
        if hasattr(arg, '__class__'):
            class_name = arg.__class__.__name__
            if class_name in ['Session', 'AsyncSession']:
                continue
        key_parts.append(str(arg))
    
    # Add kwargs
    for k, v in sorted(kwargs.items()):
        if k in ['db', 'session']:
            continue
        key_parts.append(f"{k}={v}")
    
    return ":".join(key_parts)


# Convenience functions for common cache operations
def cache_teacher_stats(teacher_id: int, period: str, data: Any, ttl: int = 300):
    """Cache teacher statistics with retry on connection errors"""
    redis_client = get_redis_client()
    if redis_client:
        try:
            key = f"teacher_stats:{teacher_id}:{period}"
            serialized = pickle.dumps(data)
            redis_client.setex(key, ttl, serialized)
            logger.info(f"✅ Cached teacher stats: {key} ({len(serialized)} bytes, TTL: {ttl}s)")
        except redis.exceptions.ReadOnlyError as e:
            logger.error(f"🔴 Redis is READ-ONLY! Resetting connection... Error: {e}")
            reset_redis_client()
        except Exception as e:
            logger.error(f"❌ Failed to cache teacher stats: {e}", exc_info=True)
            if "READONLY" in str(e).upper() or "read only" in str(e).lower():
                logger.error("🔴 Detected READ-ONLY error, resetting connection")
                reset_redis_client()


def get_cached_teacher_stats(teacher_id: int, period: str) -> Optional[Any]:
    """Get cached teacher statistics"""
    redis_client = get_redis_client()
    if redis_client:
        try:
            key = f"teacher_stats:{teacher_id}:{period}"
            cached = redis_client.get(key)
            if cached:
                return pickle.loads(cached)
        except Exception as e:
            logger.warning(f"Failed to get cached teacher stats: {e}")
    return None


def invalidate_teacher_stats(teacher_id: int):
    """Invalidate all cached stats for a teacher"""
    invalidate_cache(f"teacher_stats:{teacher_id}:*")


def cache_student_analytics(student_id: int, data: Any, ttl: int = 180):
    """Cache student analytics with retry on connection errors"""
    redis_client = get_redis_client()
    if redis_client:
        try:
            key = f"student_analytics:{student_id}"
            serialized = pickle.dumps(data)
            redis_client.setex(key, ttl, serialized)
            logger.info(f"✅ Cached student analytics: {key} ({len(serialized)} bytes, TTL: {ttl}s)")
        except redis.exceptions.ReadOnlyError as e:
            logger.error(f"🔴 Redis is READ-ONLY! Resetting connection... Error: {e}")
            reset_redis_client()
            # Retry once
            try:
                redis_client = get_redis_client()
                if redis_client:
                    redis_client.setex(key, ttl, serialized)
                    logger.info(f"✅ Retry successful: {key}")
            except Exception as retry_err:
                logger.error(f"❌ Retry failed: {retry_err}")
        except Exception as e:
            logger.error(f"❌ Failed to cache student analytics {student_id}: {e}", exc_info=True)
            if "READONLY" in str(e).upper() or "read only" in str(e).lower():
                logger.error("🔴 Detected READ-ONLY error, resetting connection")
                reset_redis_client()
    else:
        logger.warning(f"⚠️ Redis client not available for student_analytics:{student_id}")


def get_cached_student_analytics(student_id: int) -> Optional[Any]:
    """Get cached student analytics"""
    redis_client = get_redis_client()
    if redis_client:
        try:
            key = f"student_analytics:{student_id}"
            cached = redis_client.get(key)
            if cached:
                result = pickle.loads(cached)
                logger.info(f"🎯 Cache HIT: {key} ({len(cached)} bytes)")
                return result
            else:
                logger.info(f"❌ Cache MISS: {key}")
        except Exception as e:
            logger.error(f"❌ Failed to get cached student analytics {student_id}: {e}", exc_info=True)
    else:
        logger.warning(f"⚠️ Redis client not available for get student_analytics:{student_id}")
    return None
