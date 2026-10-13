import { NextResponse } from "next/server";
import { requireCommerceAccess } from "@/lib/commerce-subscription";
export async function POST(req:Request){const{user,supabase}=await requireCommerceAccess();const{abaId}=await req.json() as{abaId?:string};if(abaId)await supabase.from("commerce_abas_ativas").delete().eq("user_id",user.id).eq("aba_id",abaId);return NextResponse.json({ok:true});}
