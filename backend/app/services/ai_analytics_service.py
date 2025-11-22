import json
from datetime import UTC, datetime, timedelta

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.ai_usage import AIUsageEvent

FEATURE_KEYS = [
    "translate",
    "conversation",
    "listening",
    "writing",
    "reading",
    "flashcard",
]


class AIAnalyticsService:
    @staticmethod
    def log_usage(db: Session, user_id: int | None, feature: str, metadata: dict | None = None) -> AIUsageEvent:
        if feature not in FEATURE_KEYS:
            raise ValueError("Invalid feature")

        event = AIUsageEvent(
            user_id=user_id,
            feature=feature,
            metadata_json=json.dumps(metadata) if metadata else None,
        )
        db.add(event)
        db.commit()
        db.refresh(event)
        return event

    @staticmethod
    def _range_to_days(range_value: str) -> int:
        return {
            "7d": 7,
            "30d": 30,
            "90d": 90,
        }.get(range_value, 30)

    @staticmethod
    def get_analytics(db: Session, range_value: str = "30d") -> dict:
        days = AIAnalyticsService._range_to_days(range_value)
        now = datetime.now(UTC)
        start_time = now - timedelta(days=days - 1)

        # Total requests in range
        total_requests = (
            db.query(func.count(AIUsageEvent.id))
            .filter(AIUsageEvent.created_at >= start_time)
            .scalar()
            or 0
        )

        # Requests by feature
        rows = (
            db.query(AIUsageEvent.feature, func.count(AIUsageEvent.id))
            .filter(AIUsageEvent.created_at >= start_time)
            .group_by(AIUsageEvent.feature)
            .all()
        )
        requests_by_feature: dict[str, int] = dict.fromkeys(FEATURE_KEYS, 0)
        for feature, count in rows:
            requests_by_feature[feature] = count

        # Active users (distinct)
        active_users = (
            db.query(func.count(func.distinct(AIUsageEvent.user_id)))
            .filter(AIUsageEvent.created_at >= start_time)
            .filter(AIUsageEvent.user_id.isnot(None))
            .scalar()
            or 0
        )

        # Requests by day
        # Pre-fill date buckets for continuous range
        by_day_map: dict[str, int] = {}
        for i in range(days):
            d = (start_time + timedelta(days=i)).date().isoformat()
            by_day_map[d] = 0

        day_rows = (
            db.query(func.date(AIUsageEvent.created_at), func.count(AIUsageEvent.id))
            .filter(AIUsageEvent.created_at >= start_time)
            .group_by(func.date(AIUsageEvent.created_at))
            .all()
        )
        for day_str, count in day_rows:
            # SQLite returns string; Postgres may return date; convert to str ISO
            key = day_str if isinstance(day_str, str) else day_str.isoformat()
            if key in by_day_map:
                by_day_map[key] = count

        requests_by_day = [{"date": k, "count": v} for k, v in by_day_map.items()]

        return {
            "totalRequests": int(total_requests),
            "requestsByFeature": requests_by_feature,
            "requestsByDay": requests_by_day,
            "activeUsers": int(active_users),
        }

