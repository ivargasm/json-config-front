

export const fetchUser = async (url: string) => {
    const res = await fetch(`${url}/auth/me`, { credentials: 'include' });
    if (!res.ok) return null;
    return res.json();
};


export const login = async (email: string, password: string, url: string) => {
    const res = await fetch(`${url}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
    });
    if (res.status === 429) {
        throw new Error('Demasiados intentos. Por favor, espera un minuto e inténtalo de nuevo.');
    }
    if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.detail || 'Credenciales incorrectas');
    }
    return res;
};

export const logout = async (url: string) => {
    const res = await fetch(`${url}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
    });
    if (!res.ok) throw new Error('Error al cerrar sesión');
    return res;
};

export async function register(username: string, email: string, password: string, url: string) {
    const res = await fetch(`${url}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
    });

    if (res.status === 429) {
        throw new Error('Demasiados intentos. Por favor, espera un minuto e inténtalo de nuevo.');
    }
    if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.detail || 'Error al registrar la cuenta');
    }

    return res.json();
}

export async function forgot_password(url: string, email: string) {
    const res = await fetch(`${url}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
    });

    if (!res.ok) throw new Error('Error al enviar el correo');
    return res;
}

export async function reset_password(url: string, new_password: string, token: string) {
    const res = await fetch(`${url}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, new_password }),
    });

    if (!res.ok) throw new Error('Error al resetear la contraseña');
    return res;
}

export async function refreshToken(url: string) {
    const res = await fetch(`${url}/auth/refresh`, {
        method: "POST",
        credentials: "include",
    });
    if (!res.ok) throw new Error('Error al renovar la sesión');
    return res.json();
}

export const fetchKnowledgeBase = async (url: string) => {
    const res = await fetch(url + "/schemas/", { credentials: 'include' });
    if (!res.ok) return [];
    return res.json();
};

export const saveKnowledgeBase = async (url: string, data: any) => {
    const res = await fetch(url + "/schemas/", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: "Cerebro Global", description: "Esquema automatico", schema_data: data }),
    });
    if (!res.ok) throw new Error('Error al guardar el esquema');
    return res.json();
};


export const fetchQueries = async (url: string, schemaId: number) => {
    const res = await fetch(url + "/queries/" + schemaId, { credentials: 'include' });
    if (!res.ok) return [];
    return res.json();
};

export const saveQuery = async (url: string, schemaId: number, question: string, sql_query: string) => {
    const res = await fetch(url + "/queries/", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ schema_id: schemaId, question, sql_query }),
    });
    if (!res.ok) throw new Error('Error al guardar query');
    return res.json();
};

export const deleteQuery = async (url: string, queryId: number) => {
    const res = await fetch(url + "/queries/" + queryId, {
        method: 'DELETE',
        credentials: 'include',
    });
    if (!res.ok) throw new Error('Error al eliminar');
    return res.json();
};


export const generateSqlQuery = async (url: string, schemaId: number, prompt: string) => {
    const res = await fetch(url + "/ai/generate", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ schema_id: schemaId, prompt }),
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Error al generar el query');
    }
    return res.json();
};

export const updateQuery = async (url: string, queryId: number, schemaId: number, question: string, sql_query: string) => {
    const res = await fetch(url + "/queries/" + queryId, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ schema_id: schemaId, question, sql_query }),
    });
    if (!res.ok) throw new Error('Error al actualizar query');
    return res.json();
};

export const parseColumns = async (url: string, query: string, componentType: string) => {
    const res = await fetch(url + "/columns/parse-columns", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ query, component_type: componentType }),
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.detail || 'Error al parsear el query');
    }
    return res.json();
};


export const parsePredefinedColumns = async (url: string, query: string, jsonType: string) => {
    const res = await fetch(url + "/columns/predefined_dataset", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ query, jsonType }),
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.detail || 'Error al parsear el query');
    }
    return res.json();
};


export async function verifyRegister(email: string, code: string, url: string) {
    const res = await fetch(`${url}/auth/verify-register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
    });

    if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.detail || 'Error al verificar el código');
    }
    return res.json();
}
