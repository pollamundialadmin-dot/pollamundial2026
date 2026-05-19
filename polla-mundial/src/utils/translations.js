// src/utils/translations.js

export const countryTranslations = {
  // Conmebol
  "Argentina": "Argentina",
  "Bolivia": "Bolivia",
  "Brazil": "Brasil",
  "Chile": "Chile",
  "Colombia": "Colombia",
  "Ecuador": "Ecuador",
  "Paraguay": "Paraguay",
  "Peru": "Perú",
  "Uruguay": "Uruguay",
  "Venezuela": "Venezuela",

  // Concacaf
  "United States": "Estados Unidos",
  "USA": "Estados Unidos",
  "Mexico": "México",
  "Canada": "Canadá",
  "Costa Rica": "Costa Rica",
  "Panama": "Panamá",
  "Jamaica": "Jamaica",
  "Honduras": "Honduras",
  "El Salvador": "El Salvador",

  // UEFA (Europa)
  "Spain": "España",
  "Germany": "Alemania",
  "France": "Francia",
  "England": "Inglaterra",
  "Italy": "Italia",
  "Portugal": "Portugal",
  "Netherlands": "Países Bajos",
  "Belgium": "Bélgica",
  "Croatia": "Croacia",
  "Switzerland": "Suiza",
  "Denmark": "Dinamarca",
  "Sweden": "Suecia",
  "Poland": "Polonia",
  "Serbia": "Serbia",
  "Wales": "Gales",
  "Scotland": "Escocia",
  "Ukraine": "Ucrania",
  "Turkey": "Turquía",
  "Greece": "Grecia",
  "Czech Republic": "República Checa",

  // AFC (Asia)
  "Japan": "Japón",
  "South Korea": "Corea del Sur",
  "Korea Republic": "Corea del Sur",
  "Saudi Arabia": "Arabia Saudita",
  "Iran": "Irán",
  "Australia": "Australia",
  "Qatar": "Qatar",

  // CAF (África)
  "Senegal": "Senegal",
  "Morocco": "Marruecos",
  "Cameroon": "Camerún",
  "Ghana": "Ghana",
  "Tunisia": "Túnez",
  "Egypt": "Egipto",
  "Nigeria": "Nigeria",
  "Ivory Coast": "Costa de Marfil",
  "Côte d'Ivoire": "Costa de Marfil",
  "Algeria": "Argelia",
  "South Africa": "Sudáfrica",

  // OFC (Oceanía)
  "New Zealand": "Nueva Zelanda"
};

/**
 * Traduce el nombre de un país del inglés al español.
 * Si no está en el diccionario, devuelve el nombre original.
 */
export function translateCountry(name) {
  if (!name) return name;
  return countryTranslations[name] || name;
}

export function translateStage(stage) {
  if (!stage) return stage;
  const s = stage.toUpperCase().replace(/_/g, " ");
  if (s === "GROUP STAGE") return "Fase de Grupos";
  if (s === "LAST 16") return "Octavos de Final";
  if (s === "QUARTER FINALS") return "Cuartos de Final";
  if (s === "SEMI FINALS") return "Semifinales";
  if (s === "FINAL") return "Final";
  if (s === "THIRD PLACE") return "Tercer Puesto";
  return stage;
}

export function translateGroup(group) {
  if (!group) return group;
  // Convierte "GROUP A" o "GROUP_A" a "Grupo A"
  return group.replace(/GROUP[_ ]?/i, "Grupo ");
}
