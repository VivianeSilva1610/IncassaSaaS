"use client";

import { excluirNotaEntrada } from "../actions";

export function DeleteNoteButton({ notaId }: { notaId: string }) {
  return (
    <form
      action={excluirNotaEntrada.bind(null, notaId)}
      onSubmit={(event) => {
        if (!window.confirm("Excluir esta nota importada? Os itens conferidos serão removidos e será necessário importar o XML novamente.")) {
          event.preventDefault();
        }
      }}
    >
      <button type="submit" className="rounded-md border border-red-300 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50">
        Excluir nota importada
      </button>
    </form>
  );
}
