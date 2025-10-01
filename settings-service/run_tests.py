#!/usr/bin/env python3
"""
Test runner for Settings Service
"""
import subprocess
import sys


def run_tests():
    """Run all tests and return success status"""
    print("Running Settings Service Tests...")
    print("=" * 50)
    
    # Run model tests
    print("\n1. Running Model Tests...")
    result1 = subprocess.run([sys.executable, "-m", "pytest", "test_models.py", "-v"], 
                           capture_output=False)
    
    # Run CRUD tests
    print("\n2. Running CRUD Tests...")
    result2 = subprocess.run([sys.executable, "-m", "pytest", "test_crud.py", "-v"], 
                           capture_output=False)
    
    # Summary
    print("\n" + "=" * 50)
    if result1.returncode == 0 and result2.returncode == 0:
        print("✅ All tests passed!")
        return True
    else:
        print("❌ Some tests failed!")
        return False


if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)