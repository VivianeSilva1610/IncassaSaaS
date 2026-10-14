// Permite rodar os testes de unidade em Node puro, sem dependência nova:
// resolve o alias "@/..." para src/ e imports sem extensão para ".ts",
// como o bundler do Next faz. Uso:
//   node --experimental-strip-types --import ./tests/unit/apoio/registrar.mjs --test tests/unit/**/*.test.ts
import { register } from "node:module";

register("./resolver.mjs", import.meta.url);
