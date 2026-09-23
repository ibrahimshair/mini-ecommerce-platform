import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import Footer from "./components/Footer";

function App() {
  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content">
        <HomePage />
      </main>
      <Footer />
    </div>
  );
}

export default App;