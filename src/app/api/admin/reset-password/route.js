import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
    try {
        const { userId, newPassword } = await request.json();
        if (!userId || !newPassword ) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        if (newPassword.length < 8) return NextResponse.json({error: 'Password must be at least 8 characters'},{status: 400});

        const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, { password: newPassword });
        if (error) return NextResponse.json({ error: error.message},{status: 400});

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: 'Server error' }, {status: 500});
    }
}