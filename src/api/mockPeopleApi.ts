const TOTAL = 100
const PAGE_SIZE = 7

// 100 nomes (sem sobrenome), prontos pra serem retornados em “páginas”.
const NAMES: string[] = [
  'Ana',
  'Beatriz',
  'Carolina',
  'Daniel',
  'Eduarda',
  'Felipe',
  'Gabriela',
  'Henrique',
  'Isabela',
  'Joao',
  'Karla',
  'Lucas',
  'Mariana',
  'Natalia',
  'Otavio',
  'Paula',
  'Quentin',
  'Rafaela',
  'Sofia',
  'Thiago',
  'Ulisses',
  'Valentina',
  'Wesley',
  'Ximena',
  'Yasmin',
  'Zeca',
  'Adriana',
  'Bernardo',
  'Clara',
  'Diego',
  'Elisa',
  'Fernanda',
  'Gustavo',
  'Helena',
  'Igor',
  'Juliana',
  'Kaio',
  'Larissa',
  'Marcos',
  'Nair',
  'Otto',
  'Patricia',
  'Renata',
  'Sabrina',
  'Tiago',
  'Ursula',
  'Vera',
  'Wagner',
  'Xavier',
  'Yuri',
  'Zilda',
  'Alessandra',
  'Bruna',
  'Caio',
  'Diana',
  'Ester',
  'Fabio',
  'Gerson',
  'Heliodora',
  'Iago',
  'Jade',
  'Katia',
  'Lia',
  'Matheus',
  'Nina',
  'Oliver',
  'Priscila',
  'Ramon',
  'Sandra',
  'Taina',
  'Ubirajara',
  'Vitoria',
  'Wellington',
  'Xandre',
  'Ygor',
  'Zulmira',
  'Amanda',
  'Bruno',
  'Camila',
  'David',
  'Evelyn',
  'Fabiana',
  'Giovana',
  'Hugo',
  'Iara',
  'Joana',
  'Kaue',
  'Leandro',
  'Nicolau',
  'Olivia',
  'Otis',
  'Renzo',
  'Serena',
  'Theo',
  'Valdemar',
  'Yasmani',
  'Zoe',
  'Alfredo',
  'Cecilia',
  'Davi',
]

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(() => resolve(), ms)
  })
}

export async function fetchPeopleBatch(offset: number): Promise<string[]> {
  // contrato: sempre 7 por chamada, mas respeita o final.
  const limit = PAGE_SIZE

  await delay(2000)

  if (offset >= TOTAL) return []

  return NAMES.slice(offset, offset + limit)
}

export function getPeopleTotal() {
  return TOTAL
}

