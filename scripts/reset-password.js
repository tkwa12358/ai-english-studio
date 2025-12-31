import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'http://127.0.0.1:54321';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

const email = '13900001234@aienglish.club';
const newPassword = '13900001234';

console.log(`Resetting password for ${email}...`);

// 1. Find User ID - listUsers is paginated, but we have few users.
const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

if (listError) {
    console.error('Error listing users:', listError);
    process.exit(1);
}

const user = users.find(u => u.email === email);

if (!user) {
    console.error('User not found!');
    process.exit(1);
}

console.log(`Found user: ${user.id}`);

// 2. Update Password
const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
    user.id,
    { password: newPassword }
);

if (updateError) {
    console.error('Error updating password:', updateError);
    process.exit(1);
}

console.log('Password updated successfully!');

// 3. Verify Login
console.log('Verifying login with new password...');
const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
    email,
    password: newPassword
});

if (loginError) {
    console.error('Login Failed after reset:', loginError);
    process.exit(1);
}

console.log('Login Verification Successful!');
process.exit(0);
