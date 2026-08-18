import { createClient } from "@/lib/supabase/client";

export async function createSale(input: {
  clientName: string;
  saleDate: string;
  saleTime: string;
  price: number;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const { data, error } = await supabase.from("sales").insert({
    user_id: user.id,
    client_name: input.clientName.trim(),
    sale_date: input.saleDate,
    sale_time: input.saleTime,
    price: input.price,
    status: "pendiente"
  }).select().single();

  if (error) throw error;

  await supabase.from("transaction_history").insert({
    user_id: user.id,
    type: "venta_creada",
    amount: input.price,
    direction: "neutral",
    description: "Venta creada",
    client_name: input.clientName.trim()
  });

  return data;
}

export async function completeSale(saleId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const { data: sale, error: loadError } = await supabase
    .from("sales")
    .select("*")
    .eq("id", saleId)
    .eq("user_id", user.id)
    .single();

  if (loadError) throw loadError;
  if (sale.status !== "pendiente") throw new Error("La venta ya no está pendiente");

  const { error } = await supabase.from("sales").update({
    status: "completada",
    completed_at: new Date().toISOString()
  }).eq("id", saleId).eq("user_id", user.id);

  if (error) throw error;

  await supabase.from("transaction_history").insert({
    user_id: user.id,
    type: "venta_completada",
    amount: sale.price,
    direction: "ingreso",
    description: "Venta completada",
    client_name: sale.client_name
  });
}

export async function cancelSale(saleId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const { data: sale, error: loadError } = await supabase
    .from("sales")
    .select("*")
    .eq("id", saleId)
    .eq("user_id", user.id)
    .single();

  if (loadError) throw loadError;

  const { error } = await supabase.from("sales").update({
    status: "cancelada",
    cancelled_at: new Date().toISOString()
  }).eq("id", saleId).eq("user_id", user.id);

  if (error) throw error;

  await supabase.from("transaction_history").insert({
    user_id: user.id,
    type: "venta_cancelada",
    amount: 0,
    direction: "neutral",
    description: "Venta cancelada",
    client_name: sale.client_name
  });
}
