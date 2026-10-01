SKILL_ALIASES = {
    "python": "Python",
    "java": "Java",
    "c++": "C++",
    "c": "C",
    "sql": "SQL",

    "javascript": "JavaScript",
    "java script": "JavaScript",
    "js": "JavaScript",

    "html": "HTML",
    "html5": "HTML",

    "css": "CSS",
    "css3": "CSS",

    "bootstrap": "Bootstrap",

    "fastapi": "FastAPI",
    "fast api": "FastAPI",

    "rest api": "REST API",
    "rest apis": "REST API",
    "restful api": "REST API",
    "restful apis": "REST API",

    "mysql": "MySQL",
    "my sql": "MySQL",

    "mongodb": "MongoDB",
    "mongo db": "MongoDB",

    "sql server": "SQL Server",
    "microsoft sql server": "SQL Server",

    "git": "Git",
    "github": "GitHub",

    "pandas": "Pandas",
    "numpy": "NumPy",

    "scikit-learn": "Scikit-learn",
    "scikit learn": "Scikit-learn",
    "sklearn": "Scikit-learn",

    "matplotlib": "Matplotlib",
    "seaborn": "Seaborn",
    "scipy": "SciPy",

    "tensorflow": "TensorFlow",
    "tensor flow": "TensorFlow",

    "keras": "Keras",
    "pytorch": "PyTorch",
    "torch": "PyTorch",

    "power bi": "Power BI",
    "powerbi": "Power BI",

    "microsoft excel": "Microsoft Excel",
    "excel": "Microsoft Excel",

    "jupyter notebook": "Jupyter Notebook",
    "jupyter": "Jupyter Notebook",

    "google colab": "Google Colab",
    "colab": "Google Colab",

    "vs code": "VS Code",
    "visual studio code": "VS Code",

    "machine learning": "Machine Learning",
    "ml": "Machine Learning",

    "deep learning": "Deep Learning",

    "data science": "Data Science",
    "data analytics": "Data Analytics",

    "data cleaning": "Data Cleaning",

    "exploratory data analysis": "Exploratory Data Analysis",
    "eda": "Exploratory Data Analysis",

    "feature engineering": "Feature Engineering",

    "predictive modeling": "Predictive Modeling",
    "predictive modelling": "Predictive Modeling",

    "data mining": "Data Mining",

    "supervised learning": "Supervised Learning",
    "unsupervised learning": "Unsupervised Learning",

    "time series forecasting": "Time Series Forecasting",
    "time-series forecasting": "Time Series Forecasting",

    "anomaly detection": "Anomaly Detection",

    "isolation forest": "Isolation Forest",

    "random forest": "Random Forest",
    "random forest regressor": "Random Forest Regressor",

    "chart.js": "Chart.js",
    "chartjs": "Chart.js",
}


def normalize_skill(skill: str) -> str:
    if not skill:
        return ""

    cleaned_skill = skill.strip().lower()

    return SKILL_ALIASES.get(
        cleaned_skill,
        skill.strip()
    )


def normalize_skills(skills: list[str]) -> list[str]:
    normalized_skills = []
    seen = set()

    for skill in skills:
        normalized_skill = normalize_skill(skill)

        if not normalized_skill:
            continue

        key = normalized_skill.lower()

        if key not in seen:
            seen.add(key)
            normalized_skills.append(normalized_skill)

    return normalized_skills