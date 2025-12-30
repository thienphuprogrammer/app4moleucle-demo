import requests
import sys
import json
from datetime import datetime

class MoleculeAPITester:
    def __init__(self, base_url="https://molecule-viewer-3.preview.emergentagent.com"):
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

    # Knowledge Base API Tests
    def test_knowledge_chat_aspirin(self):
        """Test knowledge base chat with Aspirin query"""
        success, response = self.run_test(
            "Knowledge Chat - Aspirin",
            "POST",
            "api/knowledge/chat",
            200,
            data={"query": "Tell me about Aspirin"}
        )
        
        if success and 'answer' in response:
            print(f"✅ Answer received: {response['answer'][:100]}...")
            if 'C9H8O4' in response['answer']:
                print("✅ Correct Aspirin formula (C9H8O4) found in response")
            else:
                print("⚠️  Aspirin formula not found in response")
            
            if 'sources' in response and response['sources']:
                print(f"✅ Sources provided: {response['sources']}")
        
        return success, response

    def test_knowledge_chat_ethanol(self):
        """Test knowledge base chat with Ethanol query"""
        success, response = self.run_test(
            "Knowledge Chat - Ethanol",
            "POST",
            "api/knowledge/chat",
            200,
            data={"query": "What is Ethanol?"}
        )
        
        if success and 'answer' in response:
            print(f"✅ Answer received: {response['answer'][:100]}...")
            if 'C2H5OH' in response['answer']:
                print("✅ Correct Ethanol formula (C2H5OH) found in response")
            else:
                print("⚠️  Ethanol formula not found in response")
        
        return success, response

    def test_knowledge_chat_unknown(self):
        """Test knowledge base chat with unknown chemical"""
        success, response = self.run_test(
            "Knowledge Chat - Unknown Chemical",
            "POST",
            "api/knowledge/chat",
            200,
            data={"query": "Unknown chemical"}
        )
        
        if success and 'answer' in response:
            print(f"✅ Fallback answer received: {response['answer'][:100]}...")
            # Check if it's a fallback response
            if "don't have specific data" in response['answer'] or "general" in response['answer'].lower():
                print("✅ Correct fallback response detected")
            else:
                print("⚠️  Expected fallback response not detected")
        
        return success, response

    def test_knowledge_chat_caffeine(self):
        """Test knowledge base chat with Caffeine query"""
        success, response = self.run_test(
            "Knowledge Chat - Caffeine",
            "POST",
            "api/knowledge/chat",
            200,
            data={"query": "caffeine"}
        )
        
        if success and 'answer' in response:
            print(f"✅ Answer received: {response['answer'][:100]}...")
            if 'C8H10N4O2' in response['answer']:
                print("✅ Correct Caffeine formula (C8H10N4O2) found in response")
            else:
                print("⚠️  Caffeine formula not found in response")
        
        return success, response

    def test_mol2text_aspirin(self):
        """Test molecule-to-text generation with aspirin SMILES"""
        aspirin_smiles = "CC(=O)OC1=CC=CC=C1C(=O)O"
        success, response = self.run_test(
            "Mol2Text - Aspirin",
            "POST",
            "api/knowledge/mol2text",
            200,
            data={"smiles": aspirin_smiles}
        )
        
        if success and 'description' in response:
            print(f"✅ Description received: {response['description'][:100]}...")
            if response.get('success', False):
                print("✅ Mol2Text generation successful")
                if 'aspirin' in response['description'].lower():
                    print("✅ Aspirin correctly identified in description")
            else:
                print(f"⚠️  Mol2Text failed: {response.get('error', 'Unknown error')}")
        
        return success, response

    def test_mol2text_ethanol(self):
        """Test molecule-to-text generation with ethanol SMILES"""
        ethanol_smiles = "CCO"
        success, response = self.run_test(
            "Mol2Text - Ethanol",
            "POST",
            "api/knowledge/mol2text",
            200,
            data={"smiles": ethanol_smiles}
        )
        
        if success and 'description' in response:
            print(f"✅ Description received: {response['description'][:100]}...")
            if response.get('success', False):
                print("✅ Mol2Text generation successful")
                if 'ethanol' in response['description'].lower():
                    print("✅ Ethanol correctly identified in description")
            else:
                print(f"⚠️  Mol2Text failed: {response.get('error', 'Unknown error')}")
        
        return success, response

    def test_specific_molecule_generation(self):
        """Test molecule generation with specific models as requested"""
        success, response = self.run_test(
            "Generate Molecule - Aromatic Ring with Hydroxyl",
            "POST",
            "api/molecules/generate",
            200,
            data={"prompt": "A molecule with an aromatic ring and hydroxyl group", "models": ["your_model", "molt5", "chemberta"]}
        )
        
        if success and 'results' in response:
            print(f"✅ Generated {len(response['results'])} results")
            for result in response['results']:
                model_name = result.get('model_name', 'unknown')
                smiles = result.get('smiles', 'N/A')
                print(f"  {model_name}: {smiles}")
        
        return success, response

    def test_3d_ethanol(self):
        """Test 3D structure generation for ethanol specifically"""
        ethanol_smiles = "CCO"
        success, response = self.run_test(
            "3D Structure Generation - Ethanol (CCO)",
            "GET",
            f"api/molecules/3d?smiles={ethanol_smiles}",
            200
        )
        
        if success and 'sdf' in response:
            print(f"✅ SDF data received for ethanol (length: {len(response['sdf'])} chars)")
            sdf_content = response['sdf']
            if "RDKit" in sdf_content and "V2000" in sdf_content:
                print("✅ Valid SDF format detected")
                # Check for ethanol-specific atoms (2 carbons, 1 oxygen)
                if sdf_content.count(' C ') >= 2 and sdf_content.count(' O ') >= 1:
                    print("✅ Expected atoms found in SDF (2 C, 1 O)")
            else:
                print("⚠️  SDF format may be invalid")
        
        return success, response

    # Simulation API Tests
    def test_docking_simulation_covid(self):
        """Test docking simulation with COVID-19 protease"""
        # Use aspirin SMILES for testing
        aspirin_smiles = "CC(=O)OC1=CC=CC=C1C(=O)O"
        success, response = self.run_test(
            "Docking Simulation - COVID Protease",
            "POST",
            "api/simulation/docking/run",
            200,
            data={"ligand_smiles": aspirin_smiles, "target_id": "covid_protease"}
        )
        
        if success:
            print(f"✅ Docking simulation successful!")
            if 'affinity' in response:
                print(f"✅ Binding affinity: {response['affinity']} kcal/mol")
            if 'ligand_pdb' in response and response['ligand_pdb']:
                print(f"✅ Ligand PDB data received (length: {len(response['ligand_pdb'])} chars)")
            if 'target_pdb' in response and response['target_pdb']:
                print(f"✅ Target PDB data received (length: {len(response['target_pdb'])} chars)")
            if 'score_breakdown' in response:
                breakdown = response['score_breakdown']
                print(f"✅ Score breakdown: VdW={breakdown.get('van_der_waals')}, Elec={breakdown.get('electrostatic')}")
        
        return success, response

    def test_docking_simulation_hiv(self):
        """Test docking simulation with HIV protease"""
        # Use caffeine SMILES for testing
        caffeine_smiles = "CN1C=NC2=C1C(=O)N(C(=O)N2C)C"
        success, response = self.run_test(
            "Docking Simulation - HIV Protease",
            "POST",
            "api/simulation/docking/run",
            200,
            data={"ligand_smiles": caffeine_smiles, "target_id": "hiv_protease"}
        )
        
        if success:
            print(f"✅ HIV docking simulation successful!")
            if 'affinity' in response:
                print(f"✅ Binding affinity: {response['affinity']} kcal/mol")
        
        return success, response

    def test_docking_simulation_invalid_target(self):
        """Test docking simulation with invalid target"""
        aspirin_smiles = "CC(=O)OC1=CC=CC=C1C(=O)O"
        return self.run_test(
            "Docking Simulation - Invalid Target",
            "POST",
            "api/simulation/docking/run",
            404,  # Not found expected
            data={"ligand_smiles": aspirin_smiles, "target_id": "invalid_target"}
        )

    def test_docking_simulation_invalid_smiles(self):
        """Test docking simulation with invalid SMILES"""
        return self.run_test(
            "Docking Simulation - Invalid SMILES",
            "POST",
            "api/simulation/docking/run",
            500,  # Server error expected
            data={"ligand_smiles": "INVALID_SMILES", "target_id": "covid_protease"}
        )

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

    print("\n🧠 Testing Knowledge Base API...")
    # Test knowledge base queries
    success_aspirin, aspirin_kb_response = tester.test_knowledge_chat_aspirin()
    if success_aspirin:
        print("✅ Aspirin knowledge query successful!")
    
    success_ethanol, ethanol_kb_response = tester.test_knowledge_chat_ethanol()
    if success_ethanol:
        print("✅ Ethanol knowledge query successful!")
    
    success_unknown, unknown_kb_response = tester.test_knowledge_chat_unknown()
    if success_unknown:
        print("✅ Unknown chemical fallback working!")
    
    success_caffeine, caffeine_kb_response = tester.test_knowledge_chat_caffeine()
    if success_caffeine:
        print("✅ Caffeine knowledge query successful!")

    print("\n🧬 Testing Simulation API...")
    # Test docking simulations
    success_covid_dock, covid_dock_response = tester.test_docking_simulation_covid()
    if success_covid_dock:
        print("✅ COVID-19 protease docking successful!")
    
    success_hiv_dock, hiv_dock_response = tester.test_docking_simulation_hiv()
    if success_hiv_dock:
        print("✅ HIV protease docking successful!")
    
    # Test error handling
    success_invalid_target, _ = tester.test_docking_simulation_invalid_target()
    if success_invalid_target:
        print("✅ Invalid target error handling working!")
    
    success_invalid_smiles, _ = tester.test_docking_simulation_invalid_smiles()
    if success_invalid_smiles:
        print("✅ Invalid SMILES error handling working!")

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