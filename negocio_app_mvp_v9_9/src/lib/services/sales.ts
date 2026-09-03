import { createClient } from "@/lib/supabase/client";

export async function createSale(input: {
  clientName: string;
  phone?: string;
  email?: string;
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
    phone: input.phone?.trim() || null,
    email: input.email?.trim() || null,
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

export async function updateSale(saleId: string, input: {
  clientName: string;
  phone?: string;
  email?: string;
  saleDate: string;
  saleTime: string;
  price: number;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const clientName = input.clientName.trim();
  if (!clientName) throw new Error("El nombre del cliente es obligatorio");
  if (!input.saleDate || !input.saleTime) throw new Error("La fecha y la hora son obligatorias");
  if (!Number.isFinite(input.price) || input.price <= 0) throw new Error("El precio debe ser mayor que cero");

  const { data, error } = await supabase
    .from("sales")
    .update({
      client_name: clientName,
      phone: input.phone?.trim() || null,
      email: input.email?.trim() || null,
      sale_date: input.saleDate,
      sale_time: input.saleTime,
      price: input.price
    })
    .eq("id", saleId)
    .eq("user_id", user.id)
    .eq("status", "pendiente")
    .select("id,client_name,phone,email,sale_date,sale_time,price,status")
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("La cita ya no está pendiente o no existe");

  const { error: historyError } = await supabase.from("transaction_history").insert({
    user_id: user.id,
    type: "venta_modificada",
    amount: input.price,
    direction: "neutral",
    description: "Cita modificada",
    client_name: clientName
  });
  if (historyError) console.warn("No se pudo registrar la modificación en historial", historyError.message);

  return data;
}

export async function installSale(saleId: string) {
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

  const { data: updated, error } = await supabase.from("sales").update({
    status: "pendiente_pago",
    installed_at: new Date().toISOString(),
    link_note: null,
    link_agg: false,
    contact_status: null
  })
    .eq("id", saleId)
    .eq("user_id", user.id)
    .eq("status", "pendiente")
    .select("id")
    .maybeSingle();

  if (error) throw error;
  if (!updated) throw new Error("La venta ya no está pendiente");

  await supabase.from("transaction_history").insert({
    user_id: user.id,
    type: "venta_instalada",
    amount: sale.price,
    direction: "neutral",
    description: "Instalación completada · pendiente de pago",
    client_name: sale.client_name
  });
}

export async function collectSale(saleId: string) {
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
  if (sale.status !== "pendiente_pago") throw new Error("La venta ya no está pendiente de pago");

  const { data: updated, error } = await supabase.from("sales").update({
    status: "completada",
    completed_at: new Date().toISOString()
  })
    .eq("id", saleId)
    .eq("user_id", user.id)
    .eq("status", "pendiente_pago")
    .select("id")
    .maybeSingle();

  if (error) throw error;
  if (!updated) throw new Error("La venta ya no está pendiente de pago");

  await supabase.from("transaction_history").insert({
    user_id: user.id,
    type: "venta_cobrada",
    amount: sale.price,
    direction: "ingreso",
    description: "Venta cobrada",
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
  if (sale.status !== "pendiente") throw new Error("La venta ya no está pendiente");

  const { data: updated, error } = await supabase.from("sales").update({
    status: "cancelada",
    cancelled_at: new Date().toISOString(),
    link_note: null,
    link_agg: false,
    contact_status: null
  })
    .eq("id", saleId)
    .eq("user_id", user.id)
    .eq("status", "pendiente")
    .select("id")
    .maybeSingle();

  if (error) throw error;
  if (!updated) throw new Error("La venta ya no está pendiente");

  await supabase.from("transaction_history").insert({
    user_id: user.id,
    type: "venta_cancelada",
    amount: 0,
    direction: "neutral",
    description: "Venta cancelada",
    client_name: sale.client_name
  });
}
