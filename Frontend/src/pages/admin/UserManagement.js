import React, { useEffect, useState } from 'react';
import { deleteUser, fetchUsers, createUser, updateUser, fetchPricingSettings } from '../../api/api';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { DeleteModal } from '../../components';
import { Plus, Trash2, Edit } from 'lucide-react';
import '../../css/userManagement.scss';

const UserManagement = () => {
    const { t } = useTranslation();
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState();
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        phoneNumber: '',
        password: '',
        type: '',
        parkZoneCode: '',
        priceLevel: ''
    });
    const [priceLevels, setPriceLevels] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const user = useSelector((state) => state.user);

    useEffect(() => {
        fetchUsers({ setUsers });
        // Fetch price levels for valet user creation
        fetchPricingSettings({
            setPricingSettings: (data) => {
                if (data && data.priceLevels) {
                    // Extract price level names
                    const levelNames = Object.keys(data.priceLevels);
                    setPriceLevels(levelNames);
                } else {
                    setPriceLevels([]);
                }
            }
        });
    }, []);

    const handleFormChange = (field, value) => {
        setFormData({ ...formData, [field]: value });
        setError('');
        setSuccess('');
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
        setFormData({ name: '', phoneNumber: '', password: '', type: '', parkZoneCode: '', priceLevel: '' });
        fetchUsers({ setUsers });
        setTimeout(() => {
            setShowCreateModal(false);
            setSuccess('');
        }, 2000);
    };

    const handleCreateUserFailure = (error) => {
        if (typeof error === 'string') {
            setError(error);
            return;
        }
        setError(error?.message || error?.error || 'Failed to create user');
    };

    const handleDelete = (user) => {
        setSelectedUser(user);
        setShowDeleteModal(true);
    };

    const handleDeleteUser = () => {
        deleteUser({ 
            id: selectedUser?._id, 
            handleDeleteUserSuccess, 
            handleDeleteUserFailure 
        });
    };

    const handleDeleteUserSuccess = () => {
        fetchUsers({ setUsers });
        setShowDeleteModal(false);
    };

    const handleDeleteUserFailure = () => {
        setShowDeleteModal(false);
    };

    const handleEdit = (userToEdit) => {
        setEditingUser(userToEdit);
        setFormData({
            name: userToEdit?.name || '',
            phoneNumber: userToEdit?.phoneNumber || '',
            password: '', // Leave password empty for editing
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

        // Prepare update body - only include password if it's provided
        const updateBody = {
            name: formData.name,
            phoneNumber: formData.phoneNumber,
            type: formData.type,
            parkZoneCode: formData.parkZoneCode || undefined,
            priceLevel: formData.priceLevel || undefined
        };

        // Only include password if user wants to change it
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
        setFormData({ name: '', phoneNumber: '', password: '', type: '', parkZoneCode: '', priceLevel: '' });
        setEditingUser(null);
        fetchUsers({ setUsers });
        setTimeout(() => {
            setShowEditModal(false);
            setSuccess('');
        }, 2000);
    };

    const handleUpdateUserFailure = (error) => {
        setError(error?.message || error?.error || 'Failed to update user');
    };

    // System admin and manager can create users
    const canCreateUsers = user?.type === 'system_admin' || user?.type === 'manager';

    // Separate users into managerial staff and valets
    const managerialStaff = users?.filter(u => 
        u?.type === 'system_admin' || u?.type === 'admin' || u?.type === 'manager'
    ) || [];
    
    const valets = users?.filter(u => u?.type === 'valet') || [];

    // Group valets by parkZoneCode
    const valetsByZone = valets.reduce((acc, valet) => {
        const zoneCode = valet?.parkZoneCode || 'No Zone';
        if (!acc[zoneCode]) {
            acc[zoneCode] = [];
        }
        acc[zoneCode].push(valet);
        return acc;
    }, {});

    // Sort zone codes alphabetically
    const sortedZoneCodes = Object.keys(valetsByZone).sort();

    const renderUserTable = (userList, startIndex = 0) => {
        if (userList.length === 0) return null;

        return (
            <table className="users-table">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>{t('profile.name')}</th>
                        <th>{t('auth.phoneNumber')}</th>
                        <th>{t('admin.userType')}</th>
                        <th>{t('settings.actions')}</th>
                    </tr>
                </thead>
                <tbody>
                    {userList.map((item, index) => (
                        <tr key={item._id || index}>
                            <td>{startIndex + index + 1}</td>
                            <td>{item?.name}</td>
                            <td>{item?.phoneNumber}</td>
                            <td>
                                <span className={`badge badge-${item?.type}`}>
                                    {item?.type}
                                </span>
                            </td>
                            <td>
                                <div className="action-buttons">
                                    <button 
                                        className="btn-edit"
                                        onClick={() => handleEdit(item)}
                                        title="Edit user"
                                    >
                                        <Edit size={16} />
                                    </button>
                                    <button 
                                        className="btn-delete"
                                        onClick={() => handleDelete(item)}
                                        title="Delete user"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        );
    };

    return (
        <div className="user-management">
            <div className="page-header">
                <h1>{t('admin.userManagement')}</h1>
                {canCreateUsers && (
                    <button 
                        className="btn-create"
                        onClick={() => setShowCreateModal(true)}
                    >
                        <Plus size={18} />
                        {t('admin.addUser')}
                    </button>
                )}
            </div>

            {success && <div className="alert alert-success">{success}</div>}
            {error && <div className="alert alert-danger">{error}</div>}

            {/* Managerial Staff Section */}
            <div className="users-section">
                <h2 className="section-header">{t('admin.managerialStaff')}</h2>
                <div className="users-table-container">
                    {managerialStaff.length > 0 ? (
                        renderUserTable(managerialStaff)
                    ) : (
                        <div className="no-users-message">
                            <em>{t('admin.noManagerialStaff')}</em>
                        </div>
                    )}
                </div>
            </div>

            {/* Valet Staff Section - Grouped by Zone */}
            <div className="users-section">
                <h2 className="section-header">{t('admin.valetStaff')}</h2>
                {sortedZoneCodes.length > 0 ? (
                    sortedZoneCodes.map((zoneCode, zoneIndex) => {
                        // Calculate start index: managerial staff count + all valets in previous zones
                        const previousZonesCount = sortedZoneCodes
                            .slice(0, zoneIndex)
                            .reduce((sum, code) => sum + valetsByZone[code].length, 0);
                        const startIndex = managerialStaff.length + previousZonesCount;
                        
                        return (
                            <div key={zoneCode} className="zone-group">
                                <h3 className="zone-header">
                                    {t('admin.valetsInZone')}: <span className="zone-code">{zoneCode}</span>
                                </h3>
                                <div className="users-table-container">
                                    {renderUserTable(valetsByZone[zoneCode], startIndex)}
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="users-table-container">
                        <div className="no-users-message">
                            <em>{t('admin.noValetStaff')}</em>
                        </div>
                    </div>
                )}
            </div>

            {/* Create User Modal */}
            {showCreateModal && (
                <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Create New User</h2>
                            <button 
                                className="modal-close"
                                onClick={() => setShowCreateModal(false)}
                            >
                                ×
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => handleFormChange('name', e.target.value)}
                                    placeholder="Enter name"
                                />
                            </div>
                            <div className="form-group">
                                <label>Phone Number</label>
                                <input
                                    type="text"
                                    value={formData.phoneNumber}
                                    onChange={(e) => handleFormChange('phoneNumber', e.target.value)}
                                    placeholder="Enter phone number"
                                />
                            </div>
                            <div className="form-group">
                                <label>Password</label>
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => handleFormChange('password', e.target.value)}
                                    placeholder="Enter password"
                                />
                                <small>Must contain uppercase, lowercase, digit, and special character</small>
                            </div>
                            <div className="form-group">
                                <label>User Type</label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => handleFormChange('type', e.target.value)}
                                >
                                    <option value="">Select type</option>
                                    <option value="manager">Manager</option>
                                    <option value="admin">Admin</option>
                                    <option value="valet">Valet</option>
                                </select>
                            </div>
                            {formData.type === 'valet' && (
                                <>
                                    <div className="form-group">
                                        <label>Park Zone Code *</label>
                                        <input
                                            type="text"
                                            value={formData.parkZoneCode}
                                            onChange={(e) => handleFormChange('parkZoneCode', e.target.value)}
                                            placeholder="Enter park zone code"
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Price Level *</label>
                                        <select
                                            value={formData.priceLevel}
                                            onChange={(e) => handleFormChange('priceLevel', e.target.value)}
                                            required
                                        >
                                            <option value="">Select Price Level</option>
                                            {priceLevels.map((levelName) => (
                                                <option key={levelName} value={levelName}>
                                                    {levelName}
                                                </option>
                                            ))}
                                        </select>
                                        {priceLevels.length === 0 && (
                                            <small style={{ color: '#dc3545', display: 'block', marginTop: '4px' }}>
                                                No price levels available. Please create price levels in Settings first.
                                            </small>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button 
                                className="btn-cancel"
                                onClick={() => setShowCreateModal(false)}
                            >
                                Cancel
                            </button>
                            <button 
                                className="btn-submit"
                                onClick={handleCreateUser}
                            >
                                Create User
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit User Modal */}
            {showEditModal && (
                <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Edit User</h2>
                            <button 
                                className="modal-close"
                                onClick={() => setShowEditModal(false)}
                            >
                                ×
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => handleFormChange('name', e.target.value)}
                                    placeholder="Enter name"
                                />
                            </div>
                            <div className="form-group">
                                <label>Phone Number</label>
                                <input
                                    type="text"
                                    value={formData.phoneNumber}
                                    onChange={(e) => handleFormChange('phoneNumber', e.target.value)}
                                    placeholder="Enter phone number"
                                />
                            </div>
                            <div className="form-group">
                                <label>Password (Optional)</label>
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => handleFormChange('password', e.target.value)}
                                    placeholder="Leave empty to keep current password"
                                />
                                <small>Leave empty to keep current password. If provided, must contain uppercase, lowercase, digit, and special character</small>
                            </div>
                            <div className="form-group">
                                <label>User Type</label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => handleFormChange('type', e.target.value)}
                                >
                                    <option value="">Select type</option>
                                    <option value="manager">Manager</option>
                                    <option value="admin">Admin</option>
                                    <option value="valet">Valet</option>
                                </select>
                            </div>
                            {formData.type === 'valet' && (
                                <>
                                    <div className="form-group">
                                        <label>Park Zone Code *</label>
                                        <input
                                            type="text"
                                            value={formData.parkZoneCode}
                                            onChange={(e) => handleFormChange('parkZoneCode', e.target.value)}
                                            placeholder="Enter park zone code"
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Price Level *</label>
                                        <select
                                            value={formData.priceLevel}
                                            onChange={(e) => handleFormChange('priceLevel', e.target.value)}
                                            required
                                        >
                                            <option value="">Select Price Level</option>
                                            {priceLevels.map((levelName) => (
                                                <option key={levelName} value={levelName}>
                                                    {levelName}
                                                </option>
                                            ))}
                                        </select>
                                        {priceLevels.length === 0 && (
                                            <small style={{ color: '#dc3545', display: 'block', marginTop: '4px' }}>
                                                No price levels available. Please create price levels in Settings first.
                                            </small>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button 
                                className="btn-cancel"
                                onClick={() => setShowEditModal(false)}
                            >
                                Cancel
                            </button>
                            <button 
                                className="btn-submit"
                                onClick={handleUpdateUser}
                            >
                                Update User
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <DeleteModal 
                value={selectedUser?.name} 
                showModal={showDeleteModal} 
                setShowModal={setShowDeleteModal} 
                onDeleteConfirm={handleDeleteUser} 
            />
        </div>
    );
};

export default UserManagement;

