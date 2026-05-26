import { supabase } from "../config/supabaseClient.js";

export const emitEvent = async (userId, type, payload) => {
    // 1. Lógica actual: Guardar en la tabla 'notifications'
    const { error } = await supabase
        .from('notifications')
        .insert([{ user_id: userId, type, message: payload.message }]);

    // 2. Lógica futura: Conectar con Socket.io
    // io.to(userId).emit(type, payload); 

    if (error) console.error("Error guardando notificación:", error);
};