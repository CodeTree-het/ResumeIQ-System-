import csv
import random
from pathlib import Path


random.seed(42)


OUTPUT_PATH = Path(
    "datasets/resume_analysis/resume_sections.csv"
)


DOMAINS = {
    "it": {
        "roles": [
            "Software Developer",
            "Backend Developer",
            "Frontend Developer",
            "Full Stack Developer",
            "Web Developer",
        ],
        "skills": [
            "Python",
            "Java",
            "JavaScript",
            "HTML",
            "CSS",
            "Bootstrap",
            "FastAPI",
            "MySQL",
            "MongoDB",
            "Git",
        ],
        "projects": [
            "E-Commerce Web Application",
            "Service Provider System",
            "Online Booking Platform",
            "Inventory Management System",
        ],
    },

    "data_science": {
        "roles": [
            "Data Analyst",
            "Data Scientist",
            "Machine Learning Engineer",
            "Business Analyst",
        ],
        "skills": [
            "Python",
            "SQL",
            "Pandas",
            "NumPy",
            "Scikit-learn",
            "Power BI",
            "Machine Learning",
            "Data Cleaning",
            "EDA",
            "Matplotlib",
        ],
        "projects": [
            "Customer Churn Prediction",
            "Time Series Forecasting",
            "Sales Analytics Dashboard",
            "Anomaly Detection System",
        ],
    },

    "hr": {
        "roles": [
            "HR Executive",
            "HR Manager",
            "Recruiter",
            "Talent Acquisition Executive",
        ],
        "skills": [
            "Recruitment",
            "Talent Acquisition",
            "Employee Engagement",
            "Payroll",
            "HRMS",
            "Onboarding",
            "Performance Management",
            "Communication",
        ],
        "projects": [
            "Employee Engagement Analysis",
            "Recruitment Tracking System",
            "Employee Performance Study",
            "HR Analytics Dashboard",
        ],
    },

    "marketing": {
        "roles": [
            "Digital Marketing Executive",
            "Marketing Executive",
            "SEO Specialist",
            "Social Media Manager",
        ],
        "skills": [
            "SEO",
            "Google Analytics",
            "Google Ads",
            "Meta Ads",
            "Content Marketing",
            "Social Media Marketing",
            "Email Marketing",
            "Keyword Research",
        ],
        "projects": [
            "Digital Marketing Campaign",
            "SEO Optimization Project",
            "Social Media Growth Campaign",
            "Marketing Analytics Dashboard",
        ],
    },
}


DEGREES = [
    "Bachelor of Computer Applications",
    "Bachelor of Science in Information Technology",
    "Master of Computer Applications",
    "Bachelor of Business Administration",
    "Master of Business Administration",
    "Bachelor of Commerce",
]


INSTITUTIONS = [
    "PES University",
    "ABC University",
    "XYZ College",
    "Institute of Technology",
    "School of Management",
]


CERTIFICATIONS = [
    "Google Data Analytics Professional Certificate",
    "AWS Cloud Practitioner Certification",
    "Digital Marketing Certification",
    "Human Resources Management Certification",
    "Python for Data Science Certificate",
]


ACHIEVEMENTS = [
    "Received Employee of the Month award",
    "Won first prize in college project competition",
    "Improved campaign engagement by 35%",
    "Reduced processing time by 25%",
    "Achieved top performer recognition",
]


OTHER_LINES = [
    "Email: candidate@example.com",
    "Phone: +91 9876543210",
    "LinkedIn: linkedin.com/in/candidate",
    "GitHub: github.com/candidate",
    "Surat, Gujarat, India",
    "Languages: English, Hindi, Gujarati",
    "Date of Birth: 12 January 2002",
]


def add_row(
    rows: list,
    text: str,
    label: str
):
    rows.append({
        "text": text.strip(),
        "label": label
    })


def generate_summary_rows(rows):
    for domain in DOMAINS.values():

        for _ in range(40):

            role = random.choice(
                domain["roles"]
            )

            skill_sample = random.sample(
                domain["skills"],
                min(
                    4,
                    len(domain["skills"])
                )
            )

            text = (
                f"Motivated {role} with knowledge of "
                f"{', '.join(skill_sample)} and a strong "
                f"interest in solving real-world problems."
            )

            add_row(
                rows,
                text,
                "summary"
            )


def generate_skill_rows(rows):
    for domain in DOMAINS.values():

        for _ in range(40):

            number_of_skills = random.randint(
                3,
                min(
                    7,
                    len(domain["skills"])
                )
            )

            selected = random.sample(
                domain["skills"],
                number_of_skills
            )

            formats = [
                ", ".join(selected),
                "Technical Skills: "
                + ", ".join(selected),
                "Core Skills: "
                + ", ".join(selected),
                "Skills: "
                + " | ".join(selected),
            ]

            add_row(
                rows,
                random.choice(formats),
                "skills"
            )


def generate_education_rows(rows):

    for _ in range(160):

        degree = random.choice(
            DEGREES
        )

        institution = random.choice(
            INSTITUTIONS
        )

        start_year = random.randint(
            2018,
            2024
        )

        end_year = start_year + random.randint(
            2,
            4
        )

        formats = [
            (
                f"{degree}, {institution}, "
                f"{start_year} - {end_year}"
            ),
            (
                f"{degree} from {institution} "
                f"({start_year} - {end_year})"
            ),
            (
                f"{institution} | {degree} | "
                f"{start_year} - {end_year}"
            ),
        ]

        add_row(
            rows,
            random.choice(formats),
            "education"
        )


def generate_experience_rows(rows):

    companies = [
        "ABC Technologies",
        "DataVision Analytics",
        "PeopleFirst HR",
        "Growth Digital Agency",
        "Tech Solutions Pvt Ltd",
    ]

    for domain in DOMAINS.values():

        for _ in range(40):

            role = random.choice(
                domain["roles"]
            )

            company = random.choice(
                companies
            )

            start_year = random.randint(
                2019,
                2024
            )

            end_value = random.choice([
                str(start_year + 1),
                str(start_year + 2),
                "Present",
            ])

            skill = random.choice(
                domain["skills"]
            )

            formats = [
                (
                    f"{role} at {company}, "
                    f"{start_year} - {end_value}. "
                    f"Worked on {skill} related tasks."
                ),
                (
                    f"Worked as {role} with {company} "
                    f"from {start_year} to {end_value}."
                ),
            ]

            add_row(
                rows,
                random.choice(formats),
                "experience"
            )


def generate_project_rows(rows):

    for domain in DOMAINS.values():

        for _ in range(40):

            project = random.choice(
                domain["projects"]
            )

            selected_skills = random.sample(
                domain["skills"],
                min(
                    3,
                    len(domain["skills"])
                )
            )

            formats = [
                (
                    f"{project}: Developed using "
                    f"{', '.join(selected_skills)}."
                ),
                (
                    f"Project - {project}. "
                    f"Used {', '.join(selected_skills)} "
                    f"to solve a practical problem."
                ),
                (
                    f"Built {project} with "
                    f"{', '.join(selected_skills)}."
                ),
            ]

            add_row(
                rows,
                random.choice(formats),
                "projects"
            )


def generate_certification_rows(rows):

    for _ in range(160):

        certification = random.choice(
            CERTIFICATIONS
        )

        formats = [
            certification,
            f"Certification: {certification}",
            f"Completed {certification}",
            f"Certified in {certification}",
        ]

        add_row(
            rows,
            random.choice(formats),
            "certifications"
        )


def generate_achievement_rows(rows):

    for _ in range(160):

        achievement = random.choice(
            ACHIEVEMENTS
        )

        formats = [
            achievement,
            f"Achievement: {achievement}",
            f"Award: {achievement}",
            f"Recognized for: {achievement}",
        ]

        add_row(
            rows,
            random.choice(formats),
            "achievements"
        )


def generate_other_rows(rows):

    for _ in range(160):

        add_row(
            rows,
            random.choice(
                OTHER_LINES
            ),
            "other"
        )


def main():

    rows = []

    generate_summary_rows(
        rows
    )

    generate_skill_rows(
        rows
    )

    generate_education_rows(
        rows
    )

    generate_experience_rows(
        rows
    )

    generate_project_rows(
        rows
    )

    generate_certification_rows(
        rows
    )

    generate_achievement_rows(
        rows
    )

    generate_other_rows(
        rows
    )

    random.shuffle(
        rows
    )

    OUTPUT_PATH.parent.mkdir(
        parents=True,
        exist_ok=True
    )

    with OUTPUT_PATH.open(
        "w",
        newline="",
        encoding="utf-8"
    ) as file:

        writer = csv.DictWriter(
            file,
            fieldnames=[
                "text",
                "label"
            ]
        )

        writer.writeheader()

        writer.writerows(
            rows
        )

    print(
        "\nResume Analysis dataset created successfully."
    )

    print(
        f"Total rows: {len(rows)}"
    )

    print(
        f"Saved at: {OUTPUT_PATH}"
    )


if __name__ == "__main__":
    main()