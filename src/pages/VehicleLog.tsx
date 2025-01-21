import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import './VehicleLog.css';
import './RefreshBar.css';
import vehicleLogData from '../data/VehicleLog.json';

interface VehicleEntry {
    lotID: string;
    plate: string;
    timestamp: string;
    state: string;
    imagename: string;
    confidence: string; // New confidence field
}

interface SortConfig {
    key: keyof VehicleEntry | 'time' | null;
    direction: 'ascending' | 'descending';
}

const refreshInterval = 10000; // 10 seconds

const VehicleLog: React.FC = () => {
    const { lotId } = useParams<{ lotId: string }>();
    const [filteredVehicles, setFilteredVehicles] = useState<VehicleEntry[]>([]);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [refreshProgress, setRefreshProgress] = useState<number>(0);
    const [sortConfig, setSortConfig] = useState<SortConfig>({
        key: 'timestamp', // Default sorting by Date
        direction: 'ascending', // Default to ascending order
    });

    useEffect(() => {
        fetchVehicleLog();
    }, [lotId]);

    useEffect(() => {
        const interval = setInterval(() => {
            setRefreshProgress((prev) => (prev >= 100 ? 0 : prev + (100 / (refreshInterval / 100))));
            if (refreshProgress >= 100) {
                fetchVehicleLog();
            }
        }, 100);

        return () => clearInterval(interval);
    }, [refreshProgress]);

    const fetchVehicleLog = () => {
        const parsedVehicles = vehicleLogData
            .filter((entry) => entry.lotID === lotId)
            .map((entry) => ({
                ...entry,
                confidence: entry.confidence ?? '0', // Provide a default value for confidence
            }));
        setFilteredVehicles(parsedVehicles);
        setRefreshProgress(0);
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value.toLowerCase());
    };

    const filteredResults = filteredVehicles
        .filter((entry) => {
            const normalizedData = `${entry.plate} ${entry.state} ${entry.timestamp} ${entry.confidence}`.toLowerCase();
            return normalizedData.includes(searchQuery);
        })
        .sort((a, b) => {
            if (sortConfig.key) {
                let aVal: string | number = '';
                let bVal: string | number = '';

                if (sortConfig.key === 'timestamp') {
                    aVal = new Date(a.timestamp).toISOString().split('T')[0]; // Compare by date
                    bVal = new Date(b.timestamp).toISOString().split('T')[0];
                } else if (sortConfig.key === 'time') {
                    aVal = new Date(a.timestamp).toLocaleTimeString('en-US', { hour12: false }); // Compare by time
                    bVal = new Date(b.timestamp).toLocaleTimeString('en-US', { hour12: false });
                } else if (sortConfig.key === 'confidence') {
                    aVal = parseFloat(a.confidence);
                    bVal = parseFloat(b.confidence);
                } else {
                    aVal = a[sortConfig.key];
                    bVal = b[sortConfig.key];
                }

                if (sortConfig.direction === 'ascending') {
                    return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
                } else {
                    return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
                }
            }
            return 0;
        });

    const parseTimestamp = (timestamp: string) => {
        const localDate = new Date(timestamp);
        const date = localDate.toISOString().split('T')[0]; // Extract YYYY-MM-DD
        const time = localDate.toLocaleTimeString('en-US', {
            hour12: false,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        });
        return { date, time };
    };

    const handleManualRefresh = () => {
        fetchVehicleLog();
    };

    const handleDownload = () => {
        const csvHeader = 'Plate,Date,Time,State,Confidence\n';
        const csvRows = filteredResults.map(entry => {
            const { date, time } = parseTimestamp(entry.timestamp);
            return `${entry.plate},${date},${time},${entry.state},${entry.confidence}`;
        });
        const csvContent = csvHeader + csvRows.join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'VehicleLog.csv';
        link.click();
        window.URL.revokeObjectURL(url);
    };

    const handleSort = (key: keyof VehicleEntry | 'time') => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    return (
        <div className="vehicle-log">
            <div className="refresh-bar-wrapper">
                <div className="refresh-bar">
                    <div
                        className="refresh-bar-fill"
                        style={{ width: `${refreshProgress}%` }}
                    ></div>
                </div>
                <div className="refresh-text" onClick={handleManualRefresh}>
                    {refreshProgress < 100 ? 'Refreshing...' : 'Manual Refresh'}
                </div>
            </div>
            <h1>Vehicle Log</h1>
            <div className="search-and-download">
                <div className="search-bar">
                    <img src="/assets/SearchBarIcon.svg" alt="Search" />
                    <input
                        type="text"
                        placeholder="Search Plate, Date, State, Time or Confidence"
                        value={searchQuery}
                        onChange={handleSearch}
                    />
                </div>
                <button className="download-button" onClick={handleDownload}>
                    Download as Sheet
                </button>
            </div>
            <table className="vehicle-log-table">
                <thead>
                    <tr>
                        <th
                            onClick={() => handleSort('plate')}
                            className="sortable-column"
                        >
                            Plate
                            <img
                                src={
                                    sortConfig.key === 'plate'
                                        ? '/assets/FilterArrowSelected.svg'
                                        : '/assets/FilterArrow.svg'
                                }
                                alt="Sort Arrow"
                                className={`sort-arrow ${
                                    sortConfig.key === 'plate' && sortConfig.direction === 'descending'
                                        ? 'descending'
                                        : ''
                                }`}
                            />
                        </th>
                        <th
                            onClick={() => handleSort('timestamp')}
                            className="sortable-column"
                        >
                            Date
                            <img
                                src={
                                    sortConfig.key === 'timestamp'
                                        ? '/assets/FilterArrowSelected.svg'
                                        : '/assets/FilterArrow.svg'
                                }
                                alt="Sort Arrow"
                                className={`sort-arrow ${
                                    sortConfig.key === 'timestamp' && sortConfig.direction === 'descending'
                                        ? 'descending'
                                        : ''
                                }`}
                            />
                        </th>
                        <th
                            onClick={() => handleSort('time')}
                            className="sortable-column"
                        >
                            Time
                            <img
                                src={
                                    sortConfig.key === 'time'
                                        ? '/assets/FilterArrowSelected.svg'
                                        : '/assets/FilterArrow.svg'
                                }
                                alt="Sort Arrow"
                                className={`sort-arrow ${
                                    sortConfig.key === 'time' && sortConfig.direction === 'descending'
                                        ? 'descending'
                                        : ''
                                }`}
                            />
                        </th>
                        <th
                            onClick={() => handleSort('state')}
                            className="sortable-column"
                        >
                            State
                            <img
                                src={
                                    sortConfig.key === 'state'
                                        ? '/assets/FilterArrowSelected.svg'
                                        : '/assets/FilterArrow.svg'
                                }
                                alt="Sort Arrow"
                                className={`sort-arrow ${
                                    sortConfig.key === 'state' && sortConfig.direction === 'descending'
                                        ? 'descending'
                                        : ''
                                }`}
                            />
                        </th>
                        <th
                            onClick={() => handleSort('confidence')}
                            className="sortable-column"
                        >
                            Confidence
                            <img
                                src={
                                    sortConfig.key === 'confidence'
                                        ? '/assets/FilterArrowSelected.svg'
                                        : '/assets/FilterArrow.svg'
                                }
                                alt="Sort Arrow"
                                className={`sort-arrow ${
                                    sortConfig.key === 'confidence' && sortConfig.direction === 'descending'
                                        ? 'descending'
                                        : ''
                                }`}
                            />
                        </th>
                        <th>Image</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredResults.map((entry, index) => {
                        const { date, time } = parseTimestamp(entry.timestamp);
                        return (
                            <tr
                                key={index}
                                style={{ backgroundColor: index % 2 === 0 ? '#363941' : '#2B2E35' }}
                            >
                                <td>{entry.plate}</td>
                                <td>{date}</td>
                                <td>{time}</td>
                                <td>{entry.state}</td>
                                <td>{entry.confidence}%</td>
                                <td>
                                    <img
                                        src={entry.imagename === "placeholder" ? "/assets/PlatePlaceholder.jpg" : `/assets/${entry.imagename}.jpg`}
                                        alt="Vehicle Placeholder"
                                        className="vehicle-placeholder"
                                    />
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

export default VehicleLog;
