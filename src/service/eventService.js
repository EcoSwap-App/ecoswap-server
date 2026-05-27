import { supabase } from "../config/supabaseClient.js";
import { TABLES } from "../constants/entities.js";

export const emitEvent = async (userId, type, payload) => {
    // 1. Lógica actual: Guardar en la tabla 'notifications'
    const { error } = await supabase
        .from(TABLES.NOTIFICATIONS)
        .insert([{ 
            user_id: userId, 
            type, 
            title: payload.title || `Notificación de ${type || 'sistema'}`,
            message: payload.message 
        }]);

    // 2. Lógica futura: Conectar con Socket.io
    // io.to(userId).emit(type, payload); 

    if (error) console.error("Error guardando notificación:", error);
};