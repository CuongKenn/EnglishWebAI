"""
Test script for email service
Run this to test if your SMTP configuration is working correctly
This test is skipped in automated testing as it requires manual interaction
"""
import pytest


def test_email_service():
    """Test the email service with a simple email"""
    # Skip this test as it requires interactive input
    pytest.skip("Email service test requires interactive input - run manually")
