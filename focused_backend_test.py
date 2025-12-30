#!/usr/bin/env python3
import requests
import json
import sys
from datetime import datetime

class FocusedAPITester:
    def __init__(self):
        # Use the production URL from frontend/.env
        self.base_url = "https://molecule-viewer-3.preview.emergentagent.com"
        self.tests_run = 0
        self.tests_passed = 0
        self.results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name}")
        
        if details:
            print(f"   {details}")
        
        self.results.append({
            'test': name,
            'success': success,
            'details': details
        })

    def test_molecules_history(self):
        """Test GET /api/molecules/history - should return empty array []"""
        print(f"\n🔍 Testing GET /api/molecules/history...")
        url = f"{self.base_url}/api/molecules/history"
        
        try:
            response = requests.get(url, timeout=30)
            print(f"   Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"   Response: {json.dumps(data, indent=2)}")
                
                if isinstance(data, list):
                    self.log_test("GET /api/molecules/history", True, f"Returned array with {len(data)} items")
                    return True
                else:
                    self.log_test("GET /api/molecules/history", False, f"Expected array, got {type(data)}")
                    return False
            else:
                self.log_test("GET /api/molecules/history", False, f"Status {response.status_code}: {response.text[:200]}")
                return False
                
        except Exception as e:
            self.log_test("GET /api/molecules/history", False, f"Error: {str(e)}")
            return False

    def test_molecules_3d(self):
        """Test GET /api/molecules/3d?smiles=CCO - should return 3D SDF structure"""
        print(f"\n🔍 Testing GET /api/molecules/3d?smiles=CCO...")
        url = f"{self.base_url}/api/molecules/3d?smiles=CCO"
        
        try:
            response = requests.get(url, timeout=30)
            print(f"   Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"   Response keys: {list(data.keys())}")
                
                if 'sdf' in data and data['sdf']:
                    sdf_content = data['sdf']
                    print(f"   SDF length: {len(sdf_content)} characters")
                    
                    # Check for valid SDF format markers
                    if "RDKit" in sdf_content and "V2000" in sdf_content:
                        # Check for ethanol atoms (2 C, 1 O)
                        carbon_count = sdf_content.count(' C ')
                        oxygen_count = sdf_content.count(' O ')
                        print(f"   Atoms found: {carbon_count} Carbon, {oxygen_count} Oxygen")
                        
                        if carbon_count >= 2 and oxygen_count >= 1:
                            self.log_test("GET /api/molecules/3d?smiles=CCO", True, "Valid 3D SDF structure for ethanol")
                            return True
                        else:
                            self.log_test("GET /api/molecules/3d?smiles=CCO", False, f"Unexpected atom counts: C={carbon_count}, O={oxygen_count}")
                            return False
                    else:
                        self.log_test("GET /api/molecules/3d?smiles=CCO", False, "Invalid SDF format")
                        return False
                else:
                    self.log_test("GET /api/molecules/3d?smiles=CCO", False, "No SDF data in response")
                    return False
            else:
                self.log_test("GET /api/molecules/3d?smiles=CCO", False, f"Status {response.status_code}: {response.text[:200]}")
                return False
                
        except Exception as e:
            self.log_test("GET /api/molecules/3d?smiles=CCO", False, f"Error: {str(e)}")
            return False

    def test_molecules_generate(self):
        """Test POST /api/molecules/generate with aspirin molecule"""
        print(f"\n🔍 Testing POST /api/molecules/generate...")
        url = f"{self.base_url}/api/molecules/generate"
        
        payload = {
            "prompt": "aspirin molecule",
            "models": ["your_model"]
        }
        
        try:
            response = requests.post(url, json=payload, timeout=30)
            print(f"   Status Code: {response.status_code}")
            print(f"   Request: {json.dumps(payload, indent=2)}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"   Response keys: {list(data.keys())}")
                
                if 'results' in data and isinstance(data['results'], list):
                    results = data['results']
                    print(f"   Generated {len(results)} results")
                    
                    for i, result in enumerate(results):
                        model_name = result.get('model_name', 'unknown')
                        smiles = result.get('smiles', 'N/A')
                        print(f"   Result {i+1}: {model_name} -> {smiles}")
                    
                    if len(results) > 0 and results[0].get('smiles'):
                        self.log_test("POST /api/molecules/generate", True, f"Generated {len(results)} molecules successfully")
                        return True
                    else:
                        self.log_test("POST /api/molecules/generate", False, "No valid SMILES generated")
                        return False
                else:
                    self.log_test("POST /api/molecules/generate", False, "Invalid response format")
                    return False
            else:
                self.log_test("POST /api/molecules/generate", False, f"Status {response.status_code}: {response.text[:200]}")
                return False
                
        except Exception as e:
            self.log_test("POST /api/molecules/generate", False, f"Error: {str(e)}")
            return False

    def run_all_tests(self):
        """Run all focused tests"""
        print("🧪 Starting Focused Backend API Testing...")
        print("=" * 60)
        print(f"Backend URL: {self.base_url}")
        print("=" * 60)
        
        # Test 1: History endpoint
        success1 = self.test_molecules_history()
        
        # Test 2: 3D structure endpoint
        success2 = self.test_molecules_3d()
        
        # Test 3: Generate endpoint
        success3 = self.test_molecules_generate()
        
        # Summary
        print("\n" + "=" * 60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} tests passed")
        print("=" * 60)
        
        for result in self.results:
            status = "✅" if result['success'] else "❌"
            print(f"{status} {result['test']}")
            if result['details']:
                print(f"   {result['details']}")
        
        if self.tests_passed == self.tests_run:
            print("\n🎉 All tests passed! Backend APIs are working correctly.")
            return True
        else:
            print(f"\n⚠️  {self.tests_run - self.tests_passed} test(s) failed.")
            return False

def main():
    tester = FocusedAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())