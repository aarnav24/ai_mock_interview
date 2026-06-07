import { createSlice } from "@reduxjs/toolkit"

// userData: undefined = loading, null = logged out, object = logged in
const userSlice = createSlice({
    name: "user",
    initialState: {
        userData: undefined
    },
    reducers: {
        setUserData: (state, action) => {
            state.userData = action.payload
        }
    }
})

export const { setUserData } = userSlice.actions

export default userSlice.reducer
