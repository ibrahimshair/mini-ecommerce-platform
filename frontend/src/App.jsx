import { useState } from "react";
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import ProductsPage from "./pages/ProductsPage";
import Footer from "./components/Footer";

function App() {
  const [currentPage, setCurrentPage] = useState("home");
  const [selectedCategory, setSelectedCategory] = useState("Tümü");
  const [searchQuery, setSearchQuery] = useState("");

  const handleNavigate = (page, category = "Tümü") => {
    setCurrentPage(page);
    if (category) {
      setSelectedCategory(category);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSearchChange = (query) => {
    setSearchQuery(query);
    if (currentPage !== "products") {
      setCurrentPage("products");
    }
  };

  return (
    <div className="app-container">
      <Navbar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
      />
      <main className="main-content">
        {currentPage === "home" ? (
          <HomePage
            onNavigateToProducts={(category) =>
              handleNavigate("products", category || "Tümü")
            }
          />
        ) : (
          <ProductsPage
            initialCategory={selectedCategory}
            searchQuery={searchQuery}
            onNavigateHome={() => handleNavigate("home")}
          />
        )}
      </main>
      <Footer />
    </div>
  );
}

export default App;