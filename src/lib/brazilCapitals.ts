/** Coordenadas (lng, lat) das capitais e principais cidades brasileiras.
 *  Usado para plotar pins quando o tenant tem city/state preenchidos. */
export const BR_CITIES: Record<string, [number, number]> = {
  // Capitais
  'AC:RIO BRANCO': [-67.8243, -9.9747],
  'AL:MACEIO': [-35.7350, -9.6498],
  'AP:MACAPA': [-51.0664, 0.0349],
  'AM:MANAUS': [-60.0212, -3.1190],
  'BA:SALVADOR': [-38.5023, -12.9777],
  'CE:FORTALEZA': [-38.5267, -3.7327],
  'DF:BRASILIA': [-47.8825, -15.7942],
  'ES:VITORIA': [-40.3128, -20.3155],
  'GO:GOIANIA': [-49.2532, -16.6869],
  'MA:SAO LUIS': [-44.3068, -2.5297],
  'MT:CUIABA': [-56.0961, -15.6014],
  'MS:CAMPO GRANDE': [-54.6201, -20.4697],
  'MG:BELO HORIZONTE': [-43.9352, -19.9167],
  'PA:BELEM': [-48.5024, -1.4558],
  'PB:JOAO PESSOA': [-34.8631, -7.1195],
  'PR:CURITIBA': [-49.2733, -25.4284],
  'PE:RECIFE': [-34.8770, -8.0476],
  'PI:TERESINA': [-42.8019, -5.0892],
  'RJ:RIO DE JANEIRO': [-43.1729, -22.9068],
  'RN:NATAL': [-35.2094, -5.7945],
  'RS:PORTO ALEGRE': [-51.2177, -30.0346],
  'RO:PORTO VELHO': [-63.9039, -8.7619],
  'RR:BOA VISTA': [-60.6753, 2.8235],
  'SC:FLORIANOPOLIS': [-48.5482, -27.5954],
  'SP:SAO PAULO': [-46.6333, -23.5505],
  'SE:ARACAJU': [-37.0731, -10.9472],
  'TO:PALMAS': [-48.3603, -10.1844],
  // Principais cidades complementares
  'SP:CAMPINAS': [-47.0626, -22.9099],
  'SP:SANTOS': [-46.3322, -23.9608],
  'SP:GUARULHOS': [-46.5333, -23.4628],
  'SP:RIBEIRAO PRETO': [-47.8103, -21.1775],
  'SP:SOROCABA': [-47.4583, -23.5015],
  'SP:SAO JOSE DOS CAMPOS': [-45.8869, -23.2237],
  'RJ:NITEROI': [-43.1036, -22.8833],
  'RJ:CAMPOS DOS GOYTACAZES': [-41.3300, -21.7622],
  'MG:UBERLANDIA': [-48.2772, -18.9186],
  'MG:CONTAGEM': [-44.0533, -19.9317],
  'MG:JUIZ DE FORA': [-43.3503, -21.7642],
  'PR:LONDRINA': [-51.1628, -23.3045],
  'PR:MARINGA': [-51.9386, -23.4253],
  'RS:CAXIAS DO SUL': [-51.1794, -29.1678],
  'RS:PELOTAS': [-52.3414, -31.7654],
  'SC:JOINVILLE': [-48.8487, -26.3045],
  'SC:BLUMENAU': [-49.0661, -26.9194],
  'BA:FEIRA DE SANTANA': [-38.9667, -12.2667],
  'PE:OLINDA': [-34.8553, -8.0089],
  'PE:CARUARU': [-35.9764, -8.2839],
  'CE:JUAZEIRO DO NORTE': [-39.3153, -7.2128],
  'GO:ANAPOLIS': [-48.9531, -16.3267],
  'AM:PARINTINS': [-56.7367, -2.6283],
};

function norm(s: string) {
  return s
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toUpperCase().replace(/[^A-Z\s]/g, '').trim();
}

export function lookupCity(state?: string | null, city?: string | null): [number, number] | null {
  if (!state || !city) return null;
  const key = `${state.toUpperCase().trim()}:${norm(city)}`;
  return BR_CITIES[key] || null;
}
