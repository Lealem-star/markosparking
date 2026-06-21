import React, { useEffect, useMemo, useState } from 'react';
import { deactivateUser, fetchUsers, createUser, updateUser, fetchPricingSettings } from '../../api/api';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { DeleteModal } from '../../components';
import { Shield, Car } from 'lucide-react';
import {
    StaffStatCards,
    StaffFilterBar,
    StaffTable,
    ZoneAccordion,
    UserFormModal,
    filterStaff,
    getStaffStats,
    getUniqueZones,
    groupValetsByZone,
    isManagerial,
} from './staffManagement';
import '../../css/userManagement.scss';

const EMPTY_FORM = {
    name: '',
    phoneNumber: '',
    password: '',
    type: '',
    parkZoneCode: '',
    priceLevel: '',
};

const UserManagement = () => {
    const { t } = useTranslation();
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState();
    const [showDeactivateModal, setShowDeactivateModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState(EMPTY_FORM);
    const [priceLevels, setPriceLevels] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [zoneFilter, setZoneFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const user = useSelector((state) => state.user);

    useEffect(() => {
        fetchUsers({ setUsers });
        fetchPricingSettings({
            setPricingSettings: (data) => {
                if (data?.priceLevels) {
                    setPriceLevels(Object.keys(data.priceLevels));
                } else {
                    setPriceLevels([]);
                }
            }
        });
    }, []);

    const filteredUsers = useMemo(
        () => filterStaff(users, { searchQuery, roleFilter, zoneFilter, statusFilter }),
        [users, searchQuery, roleFilter, zoneFilter, statusFilter]
    );

    const stats = useMemo(() => getStaffStats(users), [users]);
    const zones = useMemo(() => getUniqueZones(users), [users]);
    const managerialStaff = useMemo(
        () => filteredUsers.filter(isManagerial),
        [filteredUsers]
    );
    const valetsByZone = useMemo(
        () => groupValetsByZone(filteredUsers.filter((u) => u?.type === 'valet')),
        [filteredUsers]
    );

    const canCreateUsers = user?.type === 'system_admin' || user?.type === 'manager';

    const handleFormChange = (field, value) => {
        setFormData({ ...formData, [field]: value });
        setError('');
        setSuccess('');
    };

    const resetForm = () => {
        setFormData(EMPTY_FORM);
        setEditingUser(null);
    };

    const handleCreateUser = () => {
        setError('');
        setSuccess('');

        if (!formData.name || !formData.phoneNumber || !formData.password || !formData.type) {
            setError('All fields are required');
            return;
        }

        if (formData.type === 'valet') {
            if (!formData.parkZoneCode) {
                setError('Park Zone Code is required for valet users');
                return;
            }
            if (!formData.priceLevel) {
                setError('Price Level is required for valet users');
                return;
            }
        }

        createUser({
            body: formData,
            token: user?.token,
            handleCreateUserSuccess,
            handleCreateUserFailure
        });
    };

    const handleCreateUserSuccess = () => {
        setSuccess('User created successfully!');
        resetForm();
        fetchUsers({ setUsers });
        setTimeout(() => {
            setShowCreateModal(false);
            setSuccess('');
        }, 2000);
    };

    const handleCreateUserFailure = (failureError) => {
        if (typeof failureError === 'string') {
            setError(failureError);
            return;
        }
        setError(failureError?.message || failureError?.error || 'Failed to create user');
    };

    const handleDeactivate = (userToDeactivate) => {
        setSelectedUser(userToDeactivate);
        setError('');
        setShowDeactivateModal(true);
    };

    const handleDeactivateUser = () => {
        deactivateUser({
            id: selectedUser?._id,
            token: user?.token,
            handleSuccess: handleDeactivateUserSuccess,
            handleFailure: handleDeactivateUserFailure,
        });
    };

    const handleDeactivateUserSuccess = () => {
        setSuccess('User deactivated successfully!');
        fetchUsers({ setUsers });
        setShowDeactivateModal(false);
        setTimeout(() => setSuccess(''), 2000);
    };

    const handleDeactivateUserFailure = (failureError) => {
        setError(typeof failureError === 'string' ? failureError : failureError?.message || 'Failed to deactivate user');
        setShowDeactivateModal(false);
    };

    const handleReactivate = (userToReactivate) => {
        setError('');
        setSuccess('');

        updateUser({
            user_id: userToReactivate?._id,
            body: { isActive: true },
            token: user?.token,
            handleUpdateUserSuccess: () => {
                setSuccess(`${userToReactivate?.name} reactivated successfully!`);
                fetchUsers({ setUsers });
                setTimeout(() => setSuccess(''), 2000);
            },
            handleUpdateUserFailure: (failureError) => {
                setError(typeof failureError === 'string' ? failureError : failureError?.message || failureError?.error || 'Failed to reactivate user');
            },
        });
    };

    const handleEdit = (userToEdit) => {
        setEditingUser(userToEdit);
        setFormData({
            name: userToEdit?.name || '',
            phoneNumber: userToEdit?.phoneNumber || '',
            password: '',
            type: userToEdit?.type || '',
            parkZoneCode: userToEdit?.parkZoneCode || '',
            priceLevel: userToEdit?.priceLevel || ''
        });
        setError('');
        setSuccess('');
        setShowEditModal(true);
    };

    const handleUpdateUser = () => {
        setError('');
        setSuccess('');

        if (!formData.name || !formData.phoneNumber || !formData.type) {
            setError('Name, phone number, and type are required');
            return;
        }

        if (formData.type === 'valet') {
            if (!formData.parkZoneCode) {
                setError('Park Zone Code is required for valet users');
                return;
            }
            if (!formData.priceLevel) {
                setError('Price Level is required for valet users');
                return;
            }
        }

        const updateBody = {
            name: formData.name,
            phoneNumber: formData.phoneNumber,
            type: formData.type,
            parkZoneCode: formData.parkZoneCode || undefined,
            priceLevel: formData.priceLevel || undefined
        };

        if (formData.password) {
            updateBody.password = formData.password;
        }

        updateUser({
            user_id: editingUser?._id,
            body: updateBody,
            token: user?.token,
            handleUpdateUserSuccess,
            handleUpdateUserFailure
        });
    };

    const handleUpdateUserSuccess = () => {
        setSuccess('User updated successfully!');
        resetForm();
        fetchUsers({ setUsers });
        setTimeout(() => {
            setShowEditModal(false);
            setSuccess('');
        }, 2000);
    };

    const handleUpdateUserFailure = (failureError) => {
        setError(typeof failureError === 'string' ? failureError : failureError?.message || failureError?.error || 'Failed to update user');
    };

    return (
        <div className="user-management user-management--v2">
            <div className="staff-page-header">
                <h1>{t('admin.userManagement')}</h1>
            </div>

            {success && <div className="alert alert-success">{success}</div>}
            {error && !showCreateModal && !showEditModal && (
                <div className="alert alert-danger">{error}</div>
            )}

            <StaffStatCards stats={stats} t={t} />

            <StaffFilterBar
                t={t}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                roleFilter={roleFilter}
                onRoleChange={setRoleFilter}
                zoneFilter={zoneFilter}
                onZoneChange={setZoneFilter}
                statusFilter={statusFilter}
                onStatusChange={setStatusFilter}
                zones={zones}
                canCreateUsers={canCreateUsers}
                onAddStaff={() => {
                    resetForm();
                    setShowCreateModal(true);
                }}
            />

            <section className="staff-section-card">
                <header className="staff-section-header">
                    <Shield size={20} />
                    <h2>{t('admin.managerialStaff')}</h2>
                    <span className="staff-section-count">{managerialStaff.length}</span>
                </header>
                <StaffTable
                    staffList={managerialStaff}
                    t={t}
                    onEdit={handleEdit}
                    onDeactivate={handleDeactivate}
                    onReactivate={handleReactivate}
                    emptyMessage={t('admin.noManagerialStaff')}
                />
            </section>

            <section className="staff-section-card">
                <header className="staff-section-header">
                    <Car size={20} />
                    <h2>{t('admin.valetStaffByZones')}</h2>
                </header>
                <ZoneAccordion
                    zones={valetsByZone}
                    t={t}
                    managerialCount={managerialStaff.length}
                    onEdit={handleEdit}
                    onDeactivate={handleDeactivate}
                    onReactivate={handleReactivate}
                />
            </section>

            <UserFormModal
                isOpen={showCreateModal}
                title="Create New User"
                formData={formData}
                priceLevels={priceLevels}
                error={error}
                onClose={() => setShowCreateModal(false)}
                onChange={handleFormChange}
                onSubmit={handleCreateUser}
                submitLabel="Create User"
                cancelLabel="Cancel"
                isPasswordRequired
            />

            <UserFormModal
                isOpen={showEditModal}
                title="Edit User"
                formData={formData}
                priceLevels={priceLevels}
                error={error}
                onClose={() => setShowEditModal(false)}
                onChange={handleFormChange}
                onSubmit={handleUpdateUser}
                submitLabel="Update User"
                cancelLabel="Cancel"
                isPasswordRequired={false}
            />

            <DeleteModal
                value={selectedUser?.name}
                showModal={showDeactivateModal}
                setShowModal={setShowDeactivateModal}
                onDeleteConfirm={handleDeactivateUser}
                title={t('admin.deactivateUser')}
                confirmLabel={t('admin.deactivateUser')}
                message={
                    <>
                        {t('admin.deactivateUserConfirm')}{' '}
                        <span className='text-warning fw-bolder'>{selectedUser?.name}</span>?
                        {' '}{t('admin.deactivateUserHint')}
                    </>
                }
            />
        </div>
    );
};

export default UserManagement;
