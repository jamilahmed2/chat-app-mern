import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { forgotPasswordAction } from "../reducers/authSlice";
import { useNavigate } from "react-router-dom";

const ForgotPassword = () => {
    const dispatch = useDispatch();
    const { isLoading, error, passwordResetEmailSent } = useSelector((state) => state.auth);
    const { register, handleSubmit } = useForm();
    const navigate = useNavigate();

    const onSubmit = (data) => {
        dispatch(forgotPasswordAction(data.email)).then((result) => {
            if (result.meta.requestStatus === "fulfilled") {
                navigate("/reset-password", { state: { email: data.email } });
            }
        });
    };

    return (
        <div className="max-w-md mx-auto bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Forgot Password</h2>
            {error && <p className="text-red-500">{error}</p>}
            {passwordResetEmailSent && <p className="text-green-500">Email sent successfully!</p>}
            <form onSubmit={handleSubmit(onSubmit)}>
                <input
                    type="email"
                    {...register("email", { required: true })}
                    placeholder="Enter your email"
                    className="w-full p-2 border rounded mb-3"
                />
                <button
                    type="submit"
                    className="bg-blue-500 text-white py-2 px-4 rounded w-full"
                    disabled={isLoading}
                >
                    {isLoading ? "Sending..." : "Reset Password"}
                </button>
            </form>
        </div>
    );
};

export default ForgotPassword;
