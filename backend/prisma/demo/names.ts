// Fictional people for demo data: common Ugandan given names and family names grouped by
// the part of the country they are most associated with. Combinations are random, so any
// match with a real person is coincidence.
import type { Region } from './uganda-districts';

export interface NamePool {
  female: string[];
  male: string[];
  family: string[];
}

export const NAMES: Record<Region, NamePool> = {
  Central: {
    female: ['Nakato', 'Namukasa', 'Nansubuga', 'Nalubega', 'Nakimuli', 'Namubiru', 'Nambooze', 'Nankya', 'Nantongo', 'Namuli', 'Nabukenya', 'Nakayiza', 'Nalwoga', 'Namagembe', 'Nabbanja', 'Nakigozi', 'Nassuuna', 'Namatovu', 'Nakabugo', 'Nalule'],
    male: ['Mukasa', 'Ssebunya', 'Kato', 'Kizito', 'Ssemakula', 'Kiwanuka', 'Lubega', 'Mugerwa', 'Ssenyonga', 'Walusimbi', 'Mayanja', 'Ssekitoleko', 'Kayemba', 'Lutaaya', 'Ssekyewa', 'Gitta', 'Kalema', 'Mawanda', 'Ssebuliba', 'Kaggwa'],
    family: ['Ssali', 'Ssekandi', 'Kigozi', 'Mutebi', 'Nsubuga', 'Kasozi', 'Katende', 'Ssebaggala', 'Musoke', 'Kalule', 'Bbosa', 'Kyeyune', 'Ggaliwango', 'Ssemwogerere', 'Lwanga', 'Kakooza', 'Ssentamu', 'Mulondo', 'Kabuye', 'Zziwa'],
  },
  Western: {
    female: ['Kemigisha', 'Kobusingye', 'Tusiime', 'Akankwasa', 'Nyakato', 'Biira', 'Masika', 'Kabugho', 'Mbambu', 'Katusiime', 'Ainembabazi', 'Atuhaire', 'Kyomuhendo', 'Tumwebaze', 'Natukunda', 'Mugisha', 'Asiimwe', 'Kamusiime', 'Twinomujuni', 'Birungi'],
    male: ['Tumusiime', 'Mugisha', 'Byamugisha', 'Mwesigye', 'Tumwebaze', 'Turyahabwe', 'Muhwezi', 'Bwambale', 'Kule', 'Mbusa', 'Kisembo', 'Baluku', 'Muhindo', 'Asiimwe', 'Atuhaire', 'Ahimbisibwe', 'Twesigye', 'Kwesiga', 'Tugume', 'Rwakaikara'],
    family: ['Mugumya', 'Tukahirwa', 'Kamugisha', 'Rwabwogo', 'Bagonza', 'Kyarimpa', 'Kiiza', 'Baguma', 'Kasaija', 'Tibenderana', 'Bwiire', 'Kahigwa', 'Mworozi', 'Ntege', 'Ruhweza', 'Kaahwa', 'Nuwagaba', 'Byaruhanga', 'Tumuhairwe', 'Mpairwe'],
  },
  Eastern: {
    female: ['Namukhula', 'Nambozo', 'Nabirye', 'Nafula', 'Nandudu', 'Namono', 'Nabulo', 'Nasike', 'Chemutai', 'Chebet', 'Apolot', 'Akol', 'Atieno', 'Namaemba', 'Nakhumicha', 'Naigaga', 'Nabwire', 'Kisakye', 'Nafuna', 'Namusisi'],
    male: ['Wamboka', 'Wanyama', 'Wekesa', 'Masaba', 'Mukhwana', 'Wanzala', 'Mugoya', 'Wakabi', 'Kaira', 'Isabirye', 'Waiswa', 'Opolot', 'Ojilong', 'Etyang', 'Epuru', 'Kiplangat', 'Kiprotich', 'Cheptoek', 'Wasike', 'Mafabi'],
    family: ['Wangolo', 'Mutonyi', 'Khaukha', 'Nabende', 'Muwanga', 'Balikowa', 'Kyewalabye', 'Bukenya', 'Mulyalya', 'Okware', 'Ekiru', 'Emorut', 'Opio', 'Kibet', 'Chelimo', 'Sabila', 'Wandera', 'Mugisha', 'Nandala', 'Bisikwa'],
  },
  Northern: {
    female: ['Akello', 'Adong', 'Apio', 'Laker', 'Atim', 'Acen', 'Amongi', 'Ayikoru', 'Candiru', 'Anyango', 'Aol', 'Aber', 'Ajok', 'Lakot', 'Auma', 'Ajambo', 'Alaso', 'Amoding', 'Ayot', 'Nyeko'],
    male: ['Okello', 'Opio', 'Ocen', 'Odong', 'Oryem', 'Ojok', 'Otim', 'Okwir', 'Ogwang', 'Opwonya', 'Anguyo', 'Dronyi', 'Ocan', 'Oloya', 'Komakech', 'Obol', 'Ongom', 'Oketch', 'Ayella', 'Lagoro'],
    family: ['Okot', 'Oyet', 'Olanya', 'Lamunu', 'Olweny', 'Ojara', 'Odokorach', 'Okidi', 'Openy', 'Ogen', 'Onen', 'Oyugi', 'Ocitti', 'Odur', 'Amuge', 'Anywar', 'Ayoo', 'Orach', 'Ongwech', 'Obwoya'],
  },
};

/** Buyers: Ugandan exporters and roasters, plus regional and overseas trading houses. */
export const BUYER_FIRST = ['Daniel', 'Grace', 'Peter', 'Sarah', 'Joseph', 'Ruth', 'Samuel', 'Esther', 'David', 'Rebecca', 'Isaac', 'Mary', 'Moses', 'Joan', 'Andrew', 'Winnie', 'Patrick', 'Doreen', 'Emmanuel', 'Susan', 'Marc', 'Anna', 'Lars', 'Elena', 'Kofi', 'Amina', 'Yusuf', 'Fatuma', 'Jean', 'Claire'];
export const BUYER_FAMILY = ['Kintu', 'Namara', 'Tumwine', 'Atwine', 'Bagenda', 'Nakiyingi', 'Okumu', 'Kyambadde', 'Mbabazi', 'Rutaro', 'Lukwago', 'Nabimanya', 'Ssewanyana', 'Opondo', 'Karuhanga', 'Habimana', 'Mwangi', 'Otieno', 'Larsen', 'Rossi', 'Schmidt', 'Dubois', 'Ndlovu', 'Hassan'];
export const BUYER_COMPANIES = ['Nile Roasters', 'Pearl Coffee Traders', 'Rwenzori Beans Ltd', 'Kampala Roast House', 'Lakeside Exporters', 'Source Africa Coffee', 'Highland Cup Co', 'Equator Green Coffee', 'Mountains of the Moon Coffee', 'Sunrise Specialty Roasters', 'Crested Crane Coffee', 'Savannah Origin', 'Nyanza Coffee Merchants', 'Elgon Premium Beans', 'Victoria Bean Brokers'];

export const TOURIST_FIRST = ['Emma', 'Liam', 'Olivia', 'Noah', 'Sofia', 'Lucas', 'Mia', 'Oliver', 'Hannah', 'Jonas', 'Chloe', 'Ethan', 'Aisha', 'Omar', 'Priya', 'Arjun', 'Yuki', 'Kenji', 'Maria', 'Diego'];
export const TOURIST_FAMILY = ['Smith', 'Johnson', 'Müller', 'Garcia', 'Rossi', 'Dupont', 'Nielsen', 'Kowalski', 'Tanaka', 'Singh', 'Brown', 'Walker', 'Silva', 'Costa', 'Haddad', 'Okafor'];
