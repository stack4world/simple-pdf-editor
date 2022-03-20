import React, { Fragment } from 'react'
import { useHistory } from "react-router-dom"

const Header = () => {
    const history = useHistory()

    const logout = async () => {
        try {
            localStorage.removeItem("user");
            // const response = await fetch('http://localhost:6060/api/v1/users/logout', { method: 'POST' });
            // const { isLoggedOut, error } = await response.json();

            // if (!isLoggedOut || error) {
            //     throw new Error(error || 'Error logging out');
            // }
            console.log("good");
            history.push('/login');
        } catch (error) {
            console.log("error");
        }
    }

    return (
        <Fragment>
            <header>
                <div className="header">
                    <a className="dashboard-header__logo">PDF Editor</a>
                    <ul className="dashboard-header__nav">
                        <li>
                            {/* <span className="text-uppercase text-size-12">{username}</span> */}
                        </li>
                        <li>
                            <button
                            className="btn btn--primary btn--sm"
                            type="button"
                            onClick={logout}>
                            Log Out
                        </button>
                        </li>
                    </ul>
                </div>
            </header>
        </Fragment>
    )
}

export default Header