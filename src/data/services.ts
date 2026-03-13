export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  durationHours: number;
  iconName: string; // Used to dynamically render lucide-react icons
}

export const services: Service[] = [
  {
    id: "lavagem-simples",
    name: "Lavagem Premium",
    description: "Lavagem externa detalhada com cera líquida e aspiração interna.",
    price: 80,
    durationHours: 1,
    iconName: "Droplets",
  },
  {
    id: "lavagem-tecnica",
    name: "Lavagem Técnica",
    description: "Limpeza profunda do motor, caixas de roda e chassi, finalizada com proteção.",
    price: 150,
    durationHours: 2,
    iconName: "Car",
  },
  {
    id: "polimento",
    name: "Polimento Comercial",
    description: "Correção de verniz até 70%, removendo micro-riscos e hologramas.",
    price: 350,
    durationHours: 4,
    iconName: "Sparkles",
  },
  {
    id: "higienizacao",
    name: "Higienização Interna",
    description: "Limpeza profunda de bancos, teto, carpetes e painel.",
    price: 250,
    durationHours: 3,
    iconName: "Wind",
  },
  {
    id: "vitrificacao",
    name: "Vitrificação de Pintura",
    description: "Proteção cerâmica de alta durabilidade (até 3 anos).",
    price: 800,
    durationHours: 5,
    iconName: "Shield",
  },
];
