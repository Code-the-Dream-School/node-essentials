# Template for Pre-Work Lesson Content

This page contains a template and set of best practices for designing learning content. 

## Best Practices

### File Naming Conventions

Lesson and assignment files must be named identically, and should utilize leading zeros for any single-digit numbers. They should always live in "lesson" and "assignment" folders respectively. This ensures proper support and ordering across the CTD suite of tools.

**Format:** `NN-topic-name.md`

**Examples:**
- `01-node-intro.md`
- `05-sql-intro.md`
- `10-deployment.md`


### Overview and Learning Objectives

Each lesson should start with a **learning objective**. This is a statement that shares what students should be able to *do* by the end of a lesson. 
  * Here's an example: "Students will learn how to store scraped data in various formats and retrieve it using SQL and Pandas."
  * Learning objectives can be followed up by a list of **topics** covered in the lesson.

In this course, topics are divided into **subsections.** 

### Subsection Content

Content should be concise, clear, and directly expand student knowledge. When possible, give examples, like this example of how to declare a varable: 

```python
name = "Jazmine"   # A variable storing a string
age = 28           # A variable storing an integer
height = 5.8       # A variable storing a float (decimal)
```

Feel free to include **Check for Understanding Questions ("CFUs")** when helpful. These are short questions that review what students just learned. Here's an example from our Lesson 1: 

**Question:** What type of data is stored in the variable `age` in the following code?

```python
age = 28
```

  * A) String
  * B) Integer
  * C) Float
  * D) Boolean

**Answer**: B) Integer

## Template

See below for a template:

---

# Lesson Name


## Lesson Overview

**Learning objective:**

Topics: 
  * TBD
  * TBD
  * TBD

## Subsection

### Subsection Check for Understanding
