import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'http://127.0.0.1:54321';
const SUPABASE_KEY = 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const email = '13900001234@aienglish.club';
const password = '13900001234';

console.log(`Testing login for ${email} with password: ${password}`);

const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
});

if (error) {
    console.error('Login Failed:', error.message);
    process.exit(1);
} else {
    console.log('Login Successful!');
    console.log('User ID:', data.user.id);
    process.exit(0);
}
