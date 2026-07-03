/* eslint-disable @typescript-eslint/no-require-imports */
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read environment variables from .env
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');

const getEnvVar = (key) => {
  const match = envContent.match(new RegExp(`^${key}=(.*)$`, 'm'));
  return match ? match[1].trim() : null;
};

const supabaseUrl = getEnvVar('NEXT_PUBLIC_SUPABASE_URL');
const supabaseAnonKey = getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY not found in .env');
  process.exit(1);
}

// Initialize Supabase Client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const runTest = async () => {
  console.log('=== STARTING AUTOMATED AUTHENTICATION TEST ===');
  const randomId = Math.floor(100000 + Math.random() * 900000);
  const testUsername = `autotest_${randomId}`;
  const testEmail = `${testUsername}@stocksviewer.local`;
  const testPassword = `password_${randomId}`;

  console.log(`Generated Test Account: "${testUsername}"`);
  console.log(`Mapped Email: "${testEmail}"`);

  try {
    // Step 1: Sign Up
    console.log('\n[Step 1/3] Registering account...');
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: `Auto Test User ${randomId}`,
        },
      },
    });

    if (signUpError) {
      throw new Error(`Sign Up failed: ${signUpError.message}`);
    }

    console.log('✓ Sign Up request succeeded!');
    console.log(`User ID created: ${signUpData.user.id}`);
    
    // Step 2: Sign In immediately
    console.log('\n[Step 2/3] Attempting immediate Login (Verifying email confirmation bypass)...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });

    if (signInError) {
      throw new Error(`Immediate Sign In failed: ${signInError.message} (This indicates email confirmation was NOT bypassed)`);
    }

    console.log('✓ Immediate Sign In succeeded!');
    console.log(`Active session user ID: ${signInData.user.id}`);

    // Step 3: Verify public.profiles table trigger
    console.log('\n[Step 3/3] Checking public.profiles record creation...');
    // Add small delay to allow trigger processing to finish
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', signInData.user.id)
      .single();

    if (profileError || !profileData) {
      throw new Error(`public.profiles synchronization check failed: ${profileError?.message || 'No profile row found'}`);
    }

    console.log('✓ public.profiles row found!');
    console.log(`Profile display name: "${profileData.full_name}"`);

    console.log('\n===========================================');
    console.log('🎉 SUCCESS: All automated authentication tests passed!');
    console.log('===========================================');

    // Return the test username so we can clean it up
    return testUsername;
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    process.exit(1);
  }
};

runTest().then((username) => {
  // Print username for the cleanup runner
  console.log(`CLEANUP_TARGET=${username}`);
  process.exit(0);
});
