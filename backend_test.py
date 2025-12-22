import requests
import sys
import json
from datetime import datetime

class MoleculeAPITester:
    def __init__(self, base_url="https://text2mol.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.results = []

    def run_test(self, name, method, endpoint, expected_status, data=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"Response: {json.dumps(response_data, indent=2)[:200]}...")
                except:
                    print(f"Response: {response.text[:200]}...")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"Response: {response.text[:200]}...")

            self.results.append({
                'test': name,
                'success': success,
                'status_code': response.status_code,
                'expected_status': expected_status,
                'response_preview': response.text[:100] if not success else "Success"
            })

            return success, response.json() if success and response.text else {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.results.append({
                'test': name,
                'success': False,
                'error': str(e)
            })
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        return self.run_test(
            "Root API Endpoint",
            "GET",
            "api/",
            200
        )

    def test_generate_molecule_aspirin(self):
        """Test molecule generation with aspirin"""
        success, response = self.run_test(
            "Generate Molecule - Aspirin",
            "POST",
            "api/molecules/generate",
            200,
            data={"prompt": "aspirin", "models": ["model_a", "model_b"]}
        )
        return success, response

    def test_generate_molecule_single_model(self):
        """Test molecule generation with single model"""
        success, response = self.run_test(
            "Generate Molecule - Single Model",
            "POST",
            "api/molecules/generate",
            200,
            data={"prompt": "caffeine", "models": ["model_a"]}
        )
        return success, response

    def test_get_history(self):
        """Test getting generation history"""
        return self.run_test(
            "Get Generation History",
            "GET",
            "api/molecules/history",
            200
        )

    def test_invalid_request(self):
        """Test invalid request handling"""
        return self.run_test(
            "Invalid Request - Empty Prompt",
            "POST",
            "api/molecules/generate",
            422,  # Validation error expected
            data={"prompt": "", "models": ["model_a"]}
        )

    def test_3d_structure_generation(self):
        """Test 3D structure generation endpoint"""
        # Test with aspirin SMILES
        aspirin_smiles = "CC(=O)OC1=CC=CC=C1C(=O)O"
        success, response = self.run_test(
            "3D Structure Generation - Aspirin",
            "GET",
            f"api/molecules/3d?smiles={aspirin_smiles}",
            200
        )
        
        if success and 'sdf' in response:
            print(f"✅ SDF data received (length: {len(response['sdf'])} chars)")
            # Check if SDF contains expected structure data
            sdf_content = response['sdf']
            if "RDKit" in sdf_content and "V2000" in sdf_content:
                print("✅ Valid SDF format detected")
            else:
                print("⚠️  SDF format may be invalid")
        
        return success, response

    def test_3d_structure_invalid_smiles(self):
        """Test 3D structure generation with invalid SMILES"""
        return self.run_test(
            "3D Structure Generation - Invalid SMILES",
            "GET",
            "api/molecules/3d?smiles=INVALID_SMILES",
            400  # Bad request expected
        )

    # Experiment API Tests
    def test_create_experiment(self):
        """Test creating a new experiment"""
        success, response = self.run_test(
            "Create Experiment",
            "POST",
            "api/experiments/",
            200,
            data={"name": "Test Exp 1", "description": "Test experiment for API testing"}
        )
        return success, response

    def test_list_experiments(self):
        """Test listing all experiments"""
        return self.run_test(
            "List Experiments",
            "GET",
            "api/experiments/",
            200
        )

    def test_get_experiment_detail(self, experiment_id):
        """Test getting experiment details"""
        return self.run_test(
            f"Get Experiment Detail - {experiment_id[:8]}",
            "GET",
            f"api/experiments/{experiment_id}",
            200
        )

    def test_get_experiment_runs(self, experiment_id):
        """Test getting experiment runs"""
        return self.run_test(
            f"Get Experiment Runs - {experiment_id[:8]}",
            "GET",
            f"api/experiments/{experiment_id}/runs",
            200
        )

    def test_generate_in_experiment(self, experiment_id, prompt="Ethanol"):
        """Test generating molecules within an experiment"""
        success, response = self.run_test(
            f"Generate in Experiment - {prompt}",
            "POST",
            f"api/experiments/{experiment_id}/generate",
            200,
            data={"prompt": prompt, "models": ["model_a"]}
        )
        return success, response

def main():
    print("🧪 Starting Molecule API Testing...")
    print("=" * 50)
    
    # Setup
    tester = MoleculeAPITester()

    # Run tests
    print("\n📡 Testing API Connectivity...")
    tester.test_root_endpoint()

    print("\n🧬 Testing Molecule Generation...")
    success, aspirin_response = tester.test_generate_molecule_aspirin()
    
    if success:
        print(f"✅ Aspirin generation successful!")
        if 'results' in aspirin_response:
            print(f"Generated {len(aspirin_response['results'])} results")
            for i, result in enumerate(aspirin_response['results']):
                print(f"  Model {i+1}: {result.get('model_name', 'unknown')} - SMILES: {result.get('smiles', 'N/A')}")
    
    tester.test_generate_molecule_single_model()

    print("\n📚 Testing History...")
    success, history_response = tester.test_get_history()
    if success and isinstance(history_response, list):
        print(f"✅ Found {len(history_response)} history records")

    print("\n🚫 Testing Error Handling...")
    tester.test_invalid_request()

    print("\n🧊 Testing 3D Structure Generation...")
    success_3d, response_3d = tester.test_3d_structure_generation()
    if success_3d:
        print("✅ 3D structure generation working correctly!")
    
    tester.test_3d_structure_invalid_smiles()

    print("\n🧪 Testing Experiments API...")
    # Test experiment creation
    success_exp, exp_response = tester.test_create_experiment()
    experiment_id = None
    if success_exp and 'id' in exp_response:
        experiment_id = exp_response['id']
        print(f"✅ Created experiment with ID: {experiment_id[:8]}...")
        
        # Test experiment listing
        success_list, list_response = tester.test_list_experiments()
        if success_list and isinstance(list_response, list):
            print(f"✅ Found {len(list_response)} experiments in list")
        
        # Test experiment detail
        tester.test_get_experiment_detail(experiment_id)
        
        # Test experiment runs (should be empty initially)
        success_runs, runs_response = tester.test_get_experiment_runs(experiment_id)
        if success_runs and isinstance(runs_response, list):
            print(f"✅ Experiment has {len(runs_response)} runs initially")
        
        # Test generation within experiment
        success_gen1, gen1_response = tester.test_generate_in_experiment(experiment_id, "Ethanol")
        if success_gen1:
            print("✅ Generated Ethanol in experiment")
        
        success_gen2, gen2_response = tester.test_generate_in_experiment(experiment_id, "Methane")
        if success_gen2:
            print("✅ Generated Methane in experiment")
        
        # Test runs again (should have 2 now)
        success_runs_final, runs_final_response = tester.test_get_experiment_runs(experiment_id)
        if success_runs_final and isinstance(runs_final_response, list):
            print(f"✅ Experiment now has {len(runs_final_response)} runs")
    else:
        print("❌ Failed to create experiment, skipping dependent tests")

    # Print final results
    print("\n" + "=" * 50)
    print(f"📊 Final Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print("⚠️  Some tests failed. Check details above.")
        print("\nFailed tests:")
        for result in tester.results:
            if not result.get('success', False):
                print(f"  - {result['test']}: {result.get('error', result.get('response_preview', 'Unknown error'))}")
        return 1

if __name__ == "__main__":
    sys.exit(main())