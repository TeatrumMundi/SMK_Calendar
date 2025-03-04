'use client';

import { useState } from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/pl';
import { getHolidays } from "@/app/utils";
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const YearlyCalendar = () => {
    dayjs.locale('pl');
    const [year, setYear] = useState(dayjs().year());
    const [darkMode, setDarkMode] = useState(true);
    const [copyStatus, setCopyStatus] = useState<boolean>(false);
    const [selectedDates, setSelectedDates] = useState<{ range: Date[]; color: string }[]>([]);
    const [selectionType, setSelectionType] = useState('');
    const [firstDate, setFirstDate] = useState<Date | null>(null);
    const months = Array.from({ length: 12 }, (_, i) => dayjs().month(i).format('MMMM'));
    const daysOfWeek = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nd'];

    // Nowe state dla dat kursu podstawowego
    const [kursStart, setKursStart] = useState<Date | null>(null);
    const [kursEnd, setKursEnd] = useState<Date | null>(null);

    // Generowanie świąt dla 50 lat w przód i w tył
    const currentYear = dayjs().year();
    const holidays = getHolidays(currentYear);

    // Ograniczenie wyboru dat do zakresu 50 lat w przód i w tył
    const currentDate = dayjs();
    const minDate = currentDate.subtract(50, 'year').toDate();
    const maxDate = currentDate.add(50, 'year').toDate();

    const colorOptions = [
        { name: 'Urlop', color: 'bg-red-400' },
        { name: 'Staże', color: 'bg-blue-400' },
        { name: 'Kursy', color: 'bg-teal-400' },
        { name: 'Samokształcenie', color: 'bg-green-400' },
        { name: 'L4', color: 'bg-[#9e4119]' },
        { name: 'Opieka nad dzieckiem', color: 'bg-yellow-500' },
        { name: 'Kwarantanna', color: 'bg-purple-400' },
        { name: 'Urlop macierzyński', color: 'bg-pink-400' },
        { name: 'Urlop wychowawczy', color: 'bg-indigo-400' },
        { name: 'Dni wolne', color: 'bg-gray-500' },
    ];
    const isRangeOverlapping = (newRange: Date[]) => {
        return selectedDates.some(({ range }) => {
            const [newStart, newEnd] = newRange;
            const [existingStart, existingEnd] = range;

            return (
                (newStart >= existingStart && newStart <= existingEnd) ||
                (newEnd >= existingStart && newEnd <= existingEnd) ||
                (newStart <= existingStart && newEnd >= existingEnd)
            );
        });
    };
    const isDayOff = (date: Date, holidays: string[]) => {
        const isHoliday = holidays.includes(dayjs(date).format('YYYY-MM-DD'));
        const isWeekend = dayjs(date).day() === 6 || dayjs(date).day() === 0;
        return isHoliday || isWeekend;
    };
    const handleDateClick = (date: Date | null) => {
        if (!date || isDayOff(date, holidays)) return;

        const existingRange = selectedDates.find(({ range }) =>
            date >= range[0] && date <= range[1]
        );

        if (existingRange) {
            setSelectedDates(selectedDates.filter(
                ({ range }) => !(date >= range[0] && date <= range[1])
            ));
            setFirstDate(null);
        } else {
            if (!selectionType) {
                alert('Najpierw wybierz typ zaznaczenia z listy rozwijanej!');
                return;
            }

            if (!firstDate) {
                setFirstDate(date);
            } else {
                const range = [firstDate, date].sort((a, b) => a.getTime() - b.getTime());

                if (isRangeOverlapping(range)) {
                    alert('Nie można dodać nakładającego się zakresu!');
                    return;
                }

                setSelectedDates([...selectedDates, { range, color: selectionType }]);
                setFirstDate(null);
            }
        }
    };
    const calculateWorkingDays = (start: Date, end: Date, holidays: string[]) => {
        if (!start || !end) return 0;
        let workingDays = 0;
        let currentDate = dayjs(start);

        while (currentDate.isBefore(end) || currentDate.isSame(end, 'day')) {
            if (!isDayOff(currentDate.toDate(), holidays)) {
                workingDays++;
            }
            currentDate = currentDate.add(1, 'day');
        }
        return workingDays;
    };
    const calculateStatistics = () => {
        const stats: { [key: string]: { ranges: string[]; totalDays: number } } = {};

        colorOptions.forEach((option) => {
            stats[option.name] = { ranges: [], totalDays: 0 };
        });

        selectedDates.forEach(({ range, color }) => {
            const type = colorOptions.find((option) => option.color === color)?.name || '';
            if (type) {
                const [start, end] = range;
                const formattedRange = `${dayjs(start).format('DD.MM.YYYY')}-${dayjs(end).format('DD.MM.YYYY')}`;
                const workingDays = calculateWorkingDays(start, end, holidays);

                stats[type].ranges.push(formattedRange);
                stats[type].totalDays += workingDays;
            }
        });

        // Statystyki dla Kursu podstawowego
        let kursPodstawowyDays = 0;
        let subtractedDays = 0;

        if (kursStart && kursEnd) {
            kursPodstawowyDays = calculateWorkingDays(kursStart, kursEnd, holidays);

            selectedDates.forEach(({ range }) => {
                const [selectedRangeStart, selectedRangeEnd] = range;

                const overlapStart = dayjs(kursStart).isAfter(selectedRangeStart) ? kursStart : selectedRangeStart;
                const overlapEnd = dayjs(kursEnd).isBefore(selectedRangeEnd) ? kursEnd : selectedRangeEnd;

                if (dayjs(overlapStart).isBefore(overlapEnd) || dayjs(overlapStart).isSame(overlapEnd)) {
                    let currentDate = dayjs(overlapStart);
                    while (currentDate.isBefore(overlapEnd) || currentDate.isSame(overlapEnd, 'day')) {
                        if (!isDayOff(currentDate.toDate(), holidays)) {
                            subtractedDays++;
                        }
                        currentDate = currentDate.add(1, 'day');
                    }
                }
            });

            kursPodstawowyDays = Math.max(0, kursPodstawowyDays - subtractedDays);
        }

        const kursPodstawowyRange = kursStart && kursEnd ? `${dayjs(kursStart).format('DD.MM.YYYY')}-${dayjs(kursEnd).format('DD.MM.YYYY')}` : '';
        stats['Kurs podstawowy'] = {
            ranges: kursPodstawowyRange ? [kursPodstawowyRange] : [],
            totalDays: kursPodstawowyDays,
        };

        return stats;
    };
    const statistics = calculateStatistics();
    const copyStatisticsToClipboard = async () => {
        let textToCopy = '';
        colorOptions.forEach((option) => {
            const stat = statistics[option.name];
            if (stat.ranges.length > 0 && option.name !== 'Kurs podstawowy') {
                textToCopy += `${option.name}:\n`;
                if (stat.ranges.length > 1) {
                    textToCopy += `- ${stat.ranges.join(', ')} - Łączna ilość dni roboczych: ${stat.totalDays}\n`;
                } else {
                    textToCopy += `- ${stat.ranges.join(', ')} - Łączna ilość dni roboczych: ${stat.totalDays}\n`;
                }
            }
        });

        // Dodaj statystyki Kursu podstawowego na końcu
        const kursStat = statistics['Kurs podstawowy'];
        if (kursStat.ranges.length > 0) {
            textToCopy += `Kurs podstawowy:\n`;
            textToCopy += `- ${kursStat.ranges.join(', ')} - Łączna ilość dni roboczych: ${kursStat.totalDays}\n`;
        }

        try {
            await navigator.clipboard.writeText(textToCopy);
            setCopyStatus(true);
            setTimeout(() => setCopyStatus(false), 1000);
        } catch (error) {
            console.error('Failed to copy text to clipboard:', error);
        }
    };

    return (
        <div className={`min-h-screen p-6 transition-all duration-300 font-roboto ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
            <div className="flex justify-center items-center gap-4 mb-6">
                <button onClick={() => setYear(year - 1)} className="p-2 rounded-lg bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 transition-all">◀ {year - 1}</button>
                <h1 className="text-3xl font-extrabold text-center">Kalendarz - {year}</h1>
                <button onClick={() => setYear(year + 1)} className="p-2 rounded-lg bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 transition-all">{year + 1} ▶</button>
                <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-lg bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 transition-all">{darkMode ? 'Tryb jasny' : 'Tryb ciemny'}</button>
            </div>

            {/* Legenda kolorów */}
            <div className="flex justify-center gap-4 mb-6 flex-wrap">
                {colorOptions.map((option) => (
                    <div key={option.name} className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full ${option.color}`}></div>
                        <span className="text-sm">{option.name}</span>
                    </div>
                ))}
            </div>

            <div className="flex gap-4 mb-6">
                <select
                    onChange={(e) => setSelectionType(e.target.value)}
                    className={`p-2 rounded-md border ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}
                    disabled={!!firstDate}
                    value={selectionType}
                >
                    <option value="">Wybierz typ zaznaczenia</option>
                    {colorOptions.map((option) => {
                        const colorName = option.color.replace('bg-', '').replace(/-[0-9]+/, '');
                        const colorMap: { [key: string]: string } = {
                            red: '239, 68, 68',
                            blue: '59, 130, 246',
                            teal: '45, 212, 191',
                            green: '52, 211, 153',
                            '[#9e4119]': '158, 65, 25',
                            yellow: '234, 179, 8',
                            purple: '168, 85, 247',
                            pink: '236, 72, 153',
                            indigo: '99, 102, 241',
                            gray: '107, 114, 128',
                        };
                        const backgroundColor = `rgba(${colorMap[colorName]}, 0.5)`;

                        return (
                            <option
                                key={option.name}
                                value={option.color}
                                style={{
                                    backgroundColor,
                                    fontFamily: 'Roboto, sans-serif',
                                    fontWeight: 'bold',
                                }}
                                className="text-white"
                            >
                                {option.name}
                            </option>
                        );
                    })}
                </select>
            </div>

            <div className="mb-6">
                <label htmlFor="kursStart" className={`block text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-700'}`}>
                    Data początkowa kursu podstawowego:
                </label>
                <DatePicker
                    selected={kursStart}
                    onChange={(date: Date | null) => setKursStart(date)}
                    minDate={minDate} // Ograniczenie do 50 lat wstecz
                    maxDate={maxDate} // Ograniczenie do 50 lat w przód
                    dateFormat="dd/MM/yyyy"
                    className={`mt-1 p-2 block w-full rounded-md border shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${darkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-300'}`}
                    placeholderText="dd/mm/rrrr"
                />
            </div>

            <div className="mb-6">
                <label htmlFor="kursEnd" className={`block text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-700'}`}>
                    Data końcowa kursu podstawowego:
                </label>
                <DatePicker
                    selected={kursEnd}
                    onChange={(date: Date | null) => setKursEnd(date)}
                    dateFormat="dd/MM/yyyy"
                    className={`mt-1 p-2 block w-full rounded-md border shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${darkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-300'}`}
                    placeholderText="dd/mm/rrrr"
                />
            </div>


            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {months.map((month, monthIndex) => {
                    const firstDay = dayjs(`${year}-${monthIndex + 1}-01`);
                    const daysInMonth = firstDay.daysInMonth();
                    const startDay = (firstDay.day() + 6) % 7;

                    return (
                        <div key={month} className="p-4 rounded-xl shadow-lg border bg-white dark:bg-gray-800 transition-all">
                            <h2 className="text-center font-bold text-lg mb-3">{month}</h2>
                            <div className="grid grid-cols-7 text-xs text-center gap-1">
                                {daysOfWeek.map((day) => (
                                    <div key={day} className="font-semibold text-gray-500 dark:text-gray-300">{day}</div>
                                ))}
                                {[...Array(startDay)].map((_, i) => (
                                    <div key={`empty-${i}`} className=""></div>
                                ))}
                                {[...Array(daysInMonth)].map((_, day) => {
                                    const date = dayjs(`${year}-${monthIndex + 1}-${day + 1}`).toDate();
                                    const isDayOffDate = isDayOff(date, holidays);
                                    const highlightColor = selectedDates.find(({ range }) =>
                                        date >= range[0] && date <= range[1]
                                    )?.color || '';

                                    return (
                                        <div
                                            key={day}
                                            className={`p-2 rounded-md text-center cursor-pointer transition-all ${
                                                isDayOffDate
                                                    ? 'bg-gray-500 cursor-not-allowed'
                                                    : highlightColor || 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
                                            }`}
                                            onClick={() => handleDateClick(date)}
                                        >
                                            {day + 1}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Statystyki */}
            <div className="mt-8">
                <div className="flex items-center mb-4">
                    <h2 className="text-2xl font-bold mr-4">Statystyki</h2>
                    <button
                        onClick={copyStatisticsToClipboard}
                        className={`p-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-all ${copyStatus ? 'bg-green-600' : ''}`}
                    >
                        {copyStatus ? 'Skopiowano!' : 'Kopiuj statystyki'}
                    </button>
                </div>
                <div className="space-y-2">
                    {colorOptions.map((option) => {
                        const stat = statistics[option.name];
                        if (option.name !== 'Kurs podstawowy') {
                            return (
                                <div key={option.name} className="flex items-center gap-2">
                                    <div className={`w-4 h-4 rounded-full ${option.color}`}></div>
                                    <span className="font-semibold">{option.name}:</span>
                                    {stat.ranges.length > 0 ? (
                                        <span>
                                            {stat.ranges.join(', ')} - Łączna ilość dni roboczych: {stat.totalDays}
                                        </span>
                                    ) : (
                                        <span>Brak</span>
                                    )}
                                </div>
                            );
                        }
                        return null;
                    })}
                    {/* Statystyki dla Kursu podstawowego wyświetlane oddzielnie*/}
                    <div key="Kurs podstawowy" className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full bg-teal-400`}></div>
                        <span className="font-semibold">Kurs podstawowy:</span>
                        {statistics['Kurs podstawowy'].ranges.length > 0 ? (
                            <span>
                                {statistics['Kurs podstawowy'].ranges.join(', ')} - Łączna ilość dni roboczych: {statistics['Kurs podstawowy'].totalDays}
                            </span>
                        ) : (
                            <span>Brak</span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default YearlyCalendar;