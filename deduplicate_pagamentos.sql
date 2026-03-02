-- Primeiro, vamos identificar as duplicatas e deletá-locs mantendo apenas o mais recente
WITH ranked_pagamentos AS (
    SELECT 
        id,
        colaborador_id,
        mes_referencia,
        status,
        created_at,
        ROW_NUMBER() OVER (
            PARTITION BY colaborador_id, mes_referencia
            ORDER BY 
                CASE WHEN status = 'pago' THEN 1 ELSE 2 END, -- Prefere manter os que já estão pagos
                created_at DESC -- Se ambos pendentes, mantém o mais recente
        ) as rn
    FROM pagamentos_colaboradores
)
DELETE FROM pagamentos_colaboradores
WHERE id IN (
    SELECT id FROM ranked_pagamentos WHERE rn > 1
);
