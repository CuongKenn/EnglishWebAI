import React, { useEffect } from 'react';

// Component that attaches global scroll/observer driven animations.
// No JSX output; cleans up listeners on unmount.
const ScrollAnimations = () => {
  useEffect(() => {
    // Intersection Observer for scroll animations
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
        }
      });
    }, observerOptions);

    // Observe all elements with animation classes
    const animatedElements = document.querySelectorAll('.fade-in, .slide-up, .slide-left, .slide-right, .scale-in');
    animatedElements.forEach((el) => observer.observe(el));

    // Smooth scroll for anchor links
    const smoothScrollLinks = document.querySelectorAll('a[href^="#"]');
    smoothScrollLinks.forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href').substring(1);
        const targetElement = document.getElementById(targetId);
        if (targetElement) {
          targetElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      });
    });

    // Parallax effect for hero sections
    const handleParallax = () => {
      const scrolled = window.pageYOffset;
      const parallaxElements = document.querySelectorAll('.parallax');
      
      parallaxElements.forEach((element) => {
        const speed = element.dataset.speed || 0.5;
        const yPos = -(scrolled * speed);
        element.style.transform = `translateY(${yPos}px)`;
      });
    };

    window.addEventListener('scroll', handleParallax);

    // Typing animation
    const typeWriter = (element, text, speed = 100) => {
      let i = 0;
      element.innerHTML = '';
      
      const timer = setInterval(() => {
        if (i < text.length) {
          element.innerHTML += text.charAt(i);
          i++;
        } else {
          clearInterval(timer);
        }
      }, speed);
    };

    // Initialize typing animation for elements with data-typewriter
    const typewriterElements = document.querySelectorAll('[data-typewriter]');
    typewriterElements.forEach((element) => {
      const text = element.dataset.typewriter;
      const speed = parseInt(element.dataset.speed) || 100;
      typeWriter(element, text, speed);
    });

    // Counter animation
    const animateCounters = () => {
      const counters = document.querySelectorAll('.counter');
      counters.forEach((counter) => {
        const target = parseInt(counter.dataset.target);
        if (Number.isNaN(target)) return; // guard invalid target
        const duration = parseInt(counter.dataset.duration) || 2000;
        const steps = Math.max(Math.floor(duration / 16), 1);
        const increment = target / steps;
        let current = 0;
        const timer = setInterval(() => {
          current += increment;
          if (current >= target) {
            current = target;
            clearInterval(timer);
          }
          counter.textContent = String(Math.floor(current));
        }, 16);
      });
    };

    // Initialize counter animation
    const counterElements = document.querySelectorAll('.counter');
    if (counterElements.length > 0) {
      const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCounters();
            counterObserver.unobserve(entry.target);
          }
        });
      });
      
      counterElements.forEach((el) => counterObserver.observe(el));
    }

    // Cleanup
    return () => {
      window.removeEventListener('scroll', handleParallax);
      observer.disconnect();
    };
  }, []);

  return null;
};

export default ScrollAnimations;


