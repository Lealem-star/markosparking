const ReportAlert = ({ error }) => {
    if (!error) return null;
    return <div className="alert alert-danger">{error}</div>;
};

export default ReportAlert;
