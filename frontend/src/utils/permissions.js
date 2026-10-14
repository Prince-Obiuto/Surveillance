// ==========================================
// GET CURRENT USER
// ==========================================

export const getCurrentUser = () => {

    try {

        const user =
            localStorage.getItem("user");

        if (!user) {
            return null;
        }

        return JSON.parse(user);

    } catch (error) {

        console.error(
            "Error reading current user:",
            error
        );

        return null;
    }

};


// ==========================================
// GET CURRENT USER ROLE
// ==========================================

export const getUserRole = () => {

    const user = getCurrentUser();

    return user?.role || null;

};


// ==========================================
// CHECK IF USER IS HOD
// ==========================================

export const isHOD = () => {

    return getUserRole() === "HOD";

};


// ==========================================
// CHECK DELETE PERMISSION
// ==========================================

export const canDelete = () => {

    return isHOD();

};