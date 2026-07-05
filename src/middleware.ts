import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
    const token = await getToken({ req: request });
    const response = NextResponse.next();

    // CORS Headers
    response.headers.set("Access-Control-Allow-Origin", process.env.NEXT_PUBLIC_BASE_URL || "*");
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PATCH, DELETE");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

    // Handle CORS Preflight Requests
    if (request.method === "OPTIONS") {
        return new Response(null, { headers: response.headers });
    }

    const pathname = request.nextUrl.pathname;

    // Restrict access based on role
    if (pathname.startsWith("/admin")) {
        if (!token || token.role !== "ADMIN") {
            return NextResponse.redirect(new URL("/unauthorized/admin", request.url));
        }
    }

    if (pathname.startsWith("/user")) {
        if (!token || token.role !== "USER") {
            return NextResponse.redirect(new URL("/unauthorized/user", request.url));
        }
    }

    if (pathname.startsWith("/partner")) {
        if (!token || token.role !== "PARTNER") {
            return NextResponse.redirect(new URL("/unauthorized/partner", request.url));
        }
    }

    return response;
}

// Apply middleware to protected routes
export const config = {
    matcher: ["/admin/:path*", "/user/:path*", "/partner/:path*"],
};
