import { resolveAssetUrl } from '../../utils/assetUrl';

const UserAvatar = ({
    user,
    className = 'user-avatar',
    imgClassName = 'user-avatar-img',
    alt = 'Profile',
}) => {
    const photoUrl = resolveAssetUrl(user?.profilePhoto);

    if (photoUrl) {
        return <img src={photoUrl} alt={alt} className={imgClassName} />;
    }

    return (
        <div className={className}>
            {user?.name?.[0]?.toUpperCase()}
        </div>
    );
};

export default UserAvatar;
