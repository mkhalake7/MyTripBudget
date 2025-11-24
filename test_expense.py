#!/usr/bin/env python3
"""
Test script to verify expense creation works
"""
import requests
import json

# Login first to get token
login_response = requests.post('http://localhost:8000/auth/login', 
    data={'username': 'md@gmail.com', 'password': 'pass'}
)

if login_response.status_code == 200:
    token = login_response.json()['access_token']
    headers = {'Authorization': f'Bearer {token}'}
    
    # Try creating a test expense
    expense_data = {
        'description': 'API Test Expense',
        'amount': 100.0,
        'group_id': 4,  # Goa group
        'payer_id': 6,  # md Khalake
        'split_type': 'EQUAL',
        'date': '2025-11-22'
    }
    
    print("Creating expense with data:")
    print(json.dumps(expense_data, indent=2))
    
    response = requests.post('http://localhost:8000/expenses/', 
        json=expense_data,
        headers=headers
    )
    
    print(f"\nResponse status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
else:
    print(f"Login failed: {login_response.status_code}")
    print(login_response.text)
