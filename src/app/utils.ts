import {addDays} from "date-fns";
import dayjs from "dayjs";

export const calculateEaster = (year: number): Date => {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;

    return new Date(year, month - 1, day);
};

export const calculateHolidays = (year: number) => {
    const easterDate = calculateEaster(year); // Wielkanoc
    const easterMonday = addDays(easterDate, 1); // Poniedziałek Wielkanocny
    const pentecost = addDays(easterDate, 49); // Zesłanie Ducha Świętego (Zielone Świątki)
    const corpusChristi = addDays(easterDate, 60); // Boże Ciało

    return {
        easter: dayjs(easterDate).format('YYYY-MM-DD'),
        easterMonday: dayjs(easterMonday).format('YYYY-MM-DD'),
        pentecost: dayjs(pentecost).format('YYYY-MM-DD'),
        corpusChristi: dayjs(corpusChristi).format('YYYY-MM-DD'),
    };
};

export const getHolidays = (currentYear: number) => {
    const holidays: string[] = [];
    const startYear = currentYear - 50;
    const endYear = currentYear + 50;

    for (let year = startYear; year <= endYear; year++) {
        const holidaysData = calculateHolidays(year);
        holidays.push(
            `${year}-01-01`, // Nowy Rok
            `${year}-01-06`, // Trzech Króli
            `${year}-05-01`, // Święto Pracy
            `${year}-05-03`, // Święto Konstytucji 3 Maja
            `${year}-08-15`, // Wniebowzięcie Najświętszej Maryi Panny
            `${year}-11-01`, // Wszystkich Świętych
            `${year}-11-11`, // Święto Niepodległości
            `${year}-12-25`, // Boże Narodzenie (pierwszy dzień)
            `${year}-12-26`, // Boże Narodzenie (drugi dzień)
            holidaysData.easter, // Wielkanoc
            holidaysData.easterMonday, // Poniedziałek Wielkanocny
            holidaysData.pentecost, // Zesłanie Ducha Świętego (Zielone Świątki)
            holidaysData.corpusChristi // Boże Ciało
        );
    }

    return holidays;
};