import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
    const cookieStore = cookies();

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
            cookies: {
                get(name) { return cookieStore.get(name)?.value; },
            },
        }
    );

    const { data: { user }, error: userError} = await supabase.auth.getUser();
    const { data: profile, error: profileError } = user ? await supabase.from('profiles').select('*').eq('id', user.id).single() : { data: null, error: null };
    
    return NextResponse.json({
        user: user ? { id: user.id, email: user.email } : null,
        userError: userError?.message ?? null,
        profile,
        profileError: profileError?.message ?? null,
    });
}