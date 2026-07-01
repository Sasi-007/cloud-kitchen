import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
    try {
        const { email, password, name, kitchen_id } = await request.json();

        if(!email || !password || !kitchen_id ) {
            return NextResponse.json({error: 'Missing required fields'}, {status: 400});
        }
        if(password.length<8){
            return NextResponse.json({error: 'Password must be at least 8 characters'}, { status: 400 });
        }
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            user_metadata: { name, role: 'admin' },
            email_confirm: true,
        });
        if(authError) {
            return NextResponse.json({ error: authError.message }, { status: 400});
        }
        const { error: profileError } = await supabaseAdmin.from('profiles').update({ role: 'admin', kitchen_id, name}).eq('id',authData.user.id);
        if(profileError){
            return NextResponse.json({error: profileError.message}, { status: 500});
        }
        return NextResponse.json({success: true, userId: authData.user.id});
    } catch (err) {
        return NextResponse.json({ error: 'Server Error'}, { status: 500});
    }
}