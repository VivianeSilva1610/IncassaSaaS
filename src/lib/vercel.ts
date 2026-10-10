const VERCEL_BASE_URL = "https://api.vercel.com";

/**
 * Adiciona um domínio de cliente ao projeto da Vercel assim que a prova de
 * propriedade (TXT) passa — sem isso, mesmo com DNS certo o domínio nunca
 * resolve (é a Vercel quem emite o certificado e aceita o Host na borda).
 *
 * Sem VERCEL_API_TOKEN/VERCEL_PROJECT_ID configurados, não falha: só avisa,
 * pra não travar a verificação de TXT (que já é o resultado real pro
 * cliente) por causa de uma integração que pode não estar configurada ainda.
 */
export async function addDomainToVercelProject(hostname: string): Promise<{ ok: boolean; aviso?: string }> {
  const token = process.env.VERCEL_API_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID;
  if (!token || !projectId) {
    return { ok: false, aviso: "Integração com a Vercel não configurada (VERCEL_API_TOKEN/VERCEL_PROJECT_ID)." };
  }

  const teamId = process.env.VERCEL_TEAM_ID;
  const url = `${VERCEL_BASE_URL}/v10/projects/${projectId}/domains${teamId ? `?teamId=${teamId}` : ""}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name: hostname }),
  });

  if (res.ok) return { ok: true };

  const data = await res.json().catch(() => null);
  // Domínio já cadastrado neste mesmo projeto — não é erro, é reexecução
  // (ex: dono clicou "Verificar agora" de novo depois de já ter funcionado).
  if (res.status === 409 && data?.error?.code === "domain_already_in_use" && data?.error?.projectId === projectId) {
    return { ok: true };
  }

  return { ok: false, aviso: data?.error?.message ?? `Erro Vercel (${res.status}) ao adicionar o domínio.` };
}
