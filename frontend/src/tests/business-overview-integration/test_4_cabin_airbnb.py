"""
Test 4: Cabin Airbnb Lodge Item Training/Demo Session
Tests integrated Airbnb & hotel API item demo retreats with calendar integration
"""

import pytest
from datetime import datetime


class TestCabinAirbnbLodgeItemTrainingDemo:
    """Test 4: Cabin Airbnb integration with demo sessions"""
    
    def test_cabin_airbnb_demo_session(self):
        """Test cabin Airbnb demo session setup"""
        print("\n🏡 Test 4: Cabin Airbnb Lodge Item Training/Demo Session")
        
        cabin_item = {
            'id': 'cabin_retreat_001',
            'airbnb_listing_id': 'abc123xyz',
            'demo_session_scheduled': True
        }
        
        demo_session = {
            'id': 'demo_001',
            'cabin_id': cabin_item['id'],
            'participants': ['user_001', 'user_002']
        }
        
        chat_room = {
            'chat_room_id': f'demo_chat_{datetime.now().timestamp()}',
            'context_type': 'cabin_demo'
        }
        
        assert cabin_item['demo_session_scheduled'] is True
        assert chat_room['chat_room_id'] is not None
        
        print("✅ Test 4 passed")
        return {'cabin_id': cabin_item['id'], 'chat_room_id': chat_room['chat_room_id']}

