import {
    ROLES,
    normalizeRole,
    isAllZonesCode,
    getSupervisorZoneList,
    parseSupervisorZones,
    supervisorCoversZone,
} from '../../constants/roles';
import { isStaffActive } from '../admin/staffManagement/staffUtils';
import { sortByZoneCode } from '../../utils/zoneSort';

export const getSupervisorParkingOfficers = (users = [], supervisor) => {
    const isSupervisor = normalizeRole(supervisor?.type) === ROLES.SUPERVISOR;
    return users.filter((entry) => {
        if (normalizeRole(entry?.type) !== ROLES.VALET || !isStaffActive(entry)) return false;
        if (isSupervisor) {
            return true;
        }
        return supervisorCoversZone(supervisor?.parkZoneCode, entry?.parkZoneCode);
    });
};

export const getParkingOfficerZoneLabel = (officer, parkZones = [], t) => {
    const code = officer?.parkZoneCode?.trim();
    if (!code) return t('admin.unknownZone');

    const zone = parkZones.find(
        (entry) => entry.code?.toUpperCase() === code.toUpperCase()
    );

    if (zone?.name) return `${zone.name} (${zone.code})`;
    return code;
};

export const getValetIdsWithActivityToday = (cars = []) => {
    const ids = new Set();

    cars.forEach((car) => {
        const valetId = car?.valet_id?._id || car?.valet_id;
        if (valetId) ids.add(String(valetId));
    });

    return ids;
};

export const partitionValetsByTodayAttendance = (valets = [], cars = []) => {
    const activeValetIds = getValetIdsWithActivityToday(cars);

    return valets.reduce(
        (result, valet) => {
            const bucket = activeValetIds.has(String(valet._id)) ? 'attended' : 'absent';
            result[bucket].push(valet);
            return result;
        },
        { attended: [], absent: [] }
    );
};

export const filterSupervisorParkingOfficers = (officers = [], { searchQuery = '', zoneFilter = 'all' }) => {
    const query = searchQuery.trim().toLowerCase();

    return officers.filter((officer) => {
        const matchesSearch =
            !query ||
            (officer?.name || '').toLowerCase().includes(query) ||
            (officer?.phoneNumber || '').toLowerCase().includes(query) ||
            (officer?.parkZoneCode || '').toLowerCase().includes(query);

        const matchesZone =
            zoneFilter === 'all' ||
            parseSupervisorZones(officer?.parkZoneCode).some(
                (zone) => zone.toUpperCase() === zoneFilter.toUpperCase()
            ) ||
            officer?.parkZoneCode?.toUpperCase() === zoneFilter.toUpperCase();

        return matchesSearch && matchesZone;
    });
};

export const getSupervisorZoneFilterOptions = (supervisor, parkZones = [], valets = []) => {
    const code = supervisor?.parkZoneCode?.trim();
    let options = [];

    if (!code || isAllZonesCode(code)) {
        options = sortByZoneCode(
            parkZones
                .filter((zone) => zone?.code && zone?.isActive !== false)
                .map((zone) => ({ code: zone.code, name: zone.name || zone.code }))
        );
    } else {
        options = sortByZoneCode(
            getSupervisorZoneList(code).map((zoneCode) => {
                const zone = parkZones.find(
                    (entry) => entry.code?.toUpperCase() === zoneCode.toUpperCase()
                );
                return {
                    code: zone?.code || zoneCode,
                    name: zone?.name || zoneCode,
                };
            })
        );
    }

    if (options.length > 0) return options;

    const codes = [...new Set(valets.map((valet) => valet?.parkZoneCode?.trim()).filter(Boolean))];
    return sortByZoneCode(
        codes.map((zoneCode) => {
            const zone = parkZones.find(
                (entry) => entry.code?.toUpperCase() === zoneCode.toUpperCase()
            );
            return {
                code: zone?.code || zoneCode,
                name: zone?.name || zoneCode,
            };
        })
    );
};

/** @deprecated use getSupervisorParkingOfficers */
export const getSupervisorValets = getSupervisorParkingOfficers;
/** @deprecated use getParkingOfficerZoneLabel */
export const getValetZoneLabel = getParkingOfficerZoneLabel;
/** @deprecated use filterSupervisorParkingOfficers */
export const filterSupervisorValets = filterSupervisorParkingOfficers;
