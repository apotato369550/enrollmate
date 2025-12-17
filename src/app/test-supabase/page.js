'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function TestSupabasePage() {
  const [testResults, setTestResults] = useState({
    envVars: null,
    connectionTest: null,
    authTest: null,
    directFetch: null,
  });

  useEffect(() => {
    runTests();
  }, []);

  const runTests = async () => {
    const results = {
      envVars: {
        url: process.env.NEXT_PUBLIC_SUPABASE_API || 'MISSING',
        hasKey: !!process.env.NEXT_PUBLIC_PUBLIC_API_KEY,
        keyPrefix: process.env.NEXT_PUBLIC_PUBLIC_API_KEY?.substring(0, 20) || 'MISSING',
      },
      connectionTest: null,
      authTest: null,
    };

    // Test 1: Environment variables
    console.log('Test 1: Environment Variables', results.envVars);

    // Test 2: Direct fetch to Supabase
    try {
      console.log('Test 2: Direct fetch to Supabase...');
      const fetchResponse = await fetch(`${results.envVars.url}/auth/v1/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      results.directFetch = {
        success: fetchResponse.ok || fetchResponse.status === 404,
        message: `HTTP ${fetchResponse.status} ${fetchResponse.statusText}`,
        details: fetchResponse.ok
          ? 'Direct fetch successful!'
          : 'Got response but not OK status',
      };
    } catch (err) {
      results.directFetch = {
        success: false,
        message: err.message,
        details: `Cannot reach Supabase URL. Error: ${err.name}`,
        stack: err.stack,
      };
    }

    // Test 3: Try to authenticate via Supabase client
    try {
      console.log('Test 3: Testing authentication via Supabase client...');

      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'test123456',
      });

      if (error) {
        results.authTest = {
          success: error.message === 'Invalid login credentials',
          message: error.message,
          details: 'Connection successful! (Expected authentication error)',
        };
      } else {
        results.authTest = {
          success: true,
          message: 'Unexpected success',
          details: 'Should have failed with invalid credentials',
        };
      }
    } catch (err) {
      results.authTest = {
        success: false,
        message: err.message,
        details: `Error type: ${err.name}`,
        stack: err.stack,
      };
    }

    setTestResults(results);
    console.log('All tests completed:', results);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Supabase Connection Test</h1>

        {/* Environment Variables Test */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            {testResults.envVars ? '✅' : '⏳'} Environment Variables
          </h2>
          {testResults.envVars && (
            <div className="space-y-2 font-mono text-sm">
              <div>
                <strong>URL:</strong> {testResults.envVars.url}
              </div>
              <div>
                <strong>Has API Key:</strong> {testResults.envVars.hasKey ? 'Yes' : 'No'}
              </div>
              <div>
                <strong>Key Prefix:</strong> {testResults.envVars.keyPrefix}
              </div>
            </div>
          )}
        </div>

        {/* Direct Fetch Test */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            {testResults.directFetch?.success ? '✅' : testResults.directFetch ? '❌' : '⏳'} Direct Fetch Test
          </h2>
          {testResults.directFetch && (
            <div className="space-y-2">
              <div>
                <strong>Status:</strong>{' '}
                <span
                  className={
                    testResults.directFetch.success ? 'text-green-600' : 'text-red-600'
                  }
                >
                  {testResults.directFetch.success ? 'Pass' : 'Fail'}
                </span>
              </div>
              <div>
                <strong>Message:</strong> {testResults.directFetch.message}
              </div>
              <div>
                <strong>Details:</strong> {testResults.directFetch.details}
              </div>
              {testResults.directFetch.stack && (
                <div className="mt-4">
                  <strong>Stack Trace:</strong>
                  <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto mt-2">
                    {testResults.directFetch.stack}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Authentication Test */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            {testResults.authTest?.success ? '✅' : testResults.authTest ? '❌' : '⏳'} Supabase Client Test
          </h2>
          {testResults.authTest && (
            <div className="space-y-2">
              <div>
                <strong>Status:</strong>{' '}
                <span
                  className={
                    testResults.authTest.success ? 'text-green-600' : 'text-red-600'
                  }
                >
                  {testResults.authTest.success ? 'Pass' : 'Fail'}
                </span>
              </div>
              <div>
                <strong>Message:</strong> {testResults.authTest.message}
              </div>
              <div>
                <strong>Details:</strong> {testResults.authTest.details}
              </div>
              {testResults.authTest.stack && (
                <div className="mt-4">
                  <strong>Stack Trace:</strong>
                  <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto mt-2">
                    {testResults.authTest.stack}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded">
          <h3 className="font-semibold mb-2">What to look for:</h3>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>Environment variables should be loaded correctly</li>
            <li>Authentication test should get "Invalid login credentials" error (this means connection works)</li>
            <li>If you see "Failed to fetch" or network errors, there's a connection issue</li>
          </ul>
        </div>

        <div className="mt-6">
          <button
            onClick={runTests}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Run Tests Again
          </button>
        </div>
      </div>
    </div>
  );
}
