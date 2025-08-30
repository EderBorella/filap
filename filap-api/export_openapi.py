#!/usr/bin/env python3
"""
Export OpenAPI spec to YAML file
"""
import json
import yaml
from app import app, create_tables

def export_openapi_spec():
    """Export the auto-generated OpenAPI spec to YAML"""
    with app.app_context():
        # Ensure database tables exist
        create_tables()
        
        # Create test client
        with app.test_client() as client:
            print("Fetching OpenAPI spec from /api/spec.json...")
            
            # Get the OpenAPI spec JSON
            response = client.get('/api/spec.json')
            
            if response.status_code == 200:
                spec_data = response.get_json()
                
                # Write JSON spec
                with open('api_spec.json', 'w') as f:
                    json.dump(spec_data, f, indent=2)
                print("[OK] Generated api_spec.json")
                
                # Write YAML spec  
                with open('api_spec.yml', 'w') as f:
                    yaml.dump(spec_data, f, default_flow_style=False, sort_keys=False)
                print("[OK] Generated api_spec.yml")
                
                print(f"\n📊 API Summary:")
                print(f"   Title: {spec_data.get('info', {}).get('title')}")
                print(f"   Version: {spec_data.get('info', {}).get('version')}")
                print(f"   Endpoints: {len(spec_data.get('paths', {}))}")
                
                # Show available endpoints
                print(f"\n🔗 Available endpoints:")
                for path, methods in spec_data.get('paths', {}).items():
                    for method in methods.keys():
                        print(f"   {method.upper()} {path}")
                
                print(f"\n📋 Access API docs at: http://localhost:5000/api/docs/")
                
            else:
                print(f"❌ Failed to fetch spec: {response.status_code}")
                print(f"Response: {response.get_data(as_text=True)}")

if __name__ == "__main__":
    export_openapi_spec()