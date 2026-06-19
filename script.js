var activeTab = 'about-section'
var searchQuery = ''
var searchRegexEnabled = false
var searchCaseInsensitive = true
var sortOption = 'dateAdded-desc'
var editingId = ''
var activities = []
var compiledSearchRegex = null

var TITLE_REGEX = /^\S(?:.*\S)?$/
var PAGES_REGEX = /^[1-9]\d*$/
var DATE_REGEX = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/
var TAG_REGEX = /^[A-Za-z]+(?:[ -][A-Za-z]+)*$/
var AUTHOR_REGEX = /^[A-Za-zÀ-ÖØ-öø-ÿ]+(?:[ -][A-Za-zÀ-ÖØ-öø-ÿ]+)*$/
var ISBN_REGEX = /^(?:97[89][ -]?)?\d{1,5}[ -]?\d{1,7}[ -]?\d{1,7}[ -]?[\dX]$/i
var DUPLICATE_WORD_REGEX = /\b(\w+)\s+\1\b/i

function loadBooks() {
  try {
    var raw = localStorage.getItem('vault:books')
    if (raw == null) {
      return []
    }
    return JSON.parse(raw)
  } catch (e) {
    return []
  }
}

function saveBooks(books) {
  try {
    localStorage.setItem('vault:books', JSON.stringify(books))
  } catch (e) {
  }
}

function validateTitle(title) {
  if (!title) {
    return false
  }
  return TITLE_REGEX.test(title)
}

function validateAuthor(author) {
  if (!author) {
    return false
  }
  var cleanAuthor = author.replace(/\./g, ' ')
  var singleSpaced = cleanAuthor.trim().replace(/\s+/g, ' ')
  return AUTHOR_REGEX.test(singleSpaced)
}

function validatePages(pages) {
  return PAGES_REGEX.test(String(pages).trim())
}

function validateDate(date) {
  if (!date) {
    return false
  }
  if (!DATE_REGEX.test(date)) {
    return false
  }
  var parts = date.split('-')
  var year = parseInt(parts[0])
  var month = parseInt(parts[1]) - 1
  var day = parseInt(parts[2])
  var d = new Date(year, month, day)
  return d.getFullYear() == year && d.getMonth() == month && d.getDate() == day
}

function validateTag(tag) {
  if (!tag) {
    return false
  }
  return TAG_REGEX.test(tag.trim())
}

function validateIsbn(isbn) {
  if (!isbn) {
    return true
  }
  var cleanIsbn = isbn.replace(/[- ]/g, '')
  if (!/^\d{9}[\dXx]$|^\d{13}$/.test(cleanIsbn)) {
    return false
  }
  if (cleanIsbn.length == 10) {
    var sum = 0
    for (var i = 0; i < 9; i++) {
      sum += parseInt(cleanIsbn[i]) * (10 - i)
    }
    var lastChar = cleanIsbn[9].toUpperCase()
    sum += (lastChar == 'X') ? 10 : parseInt(lastChar)
    return (sum % 11) == 0
  } else if (cleanIsbn.length == 13) {
    var sum = 0
    for (var i = 0; i < 12; i++) {
      sum += parseInt(cleanIsbn[i]) * (i % 2 == 0 ? 1 : 3)
    }
    var checkDigit = (10 - (sum % 10)) % 10
    return checkDigit == parseInt(cleanIsbn[12])
  }
  return false
}

function hasDuplicateWords(text) {
  if (!text) {
    return false
  }
  return DUPLICATE_WORD_REGEX.test(text)
}

function getDuplicateWord(text) {
  var match = text.match(DUPLICATE_WORD_REGEX)
  if (match) {
    return match[1]
  }
  return null
}

var validateISBN = validateIsbn
var validateDateAdded = validateDate
var extractDuplicateWord = getDuplicateWord
var validateBookTag = validateTag

function getActiveBooks() {
  var books = loadBooks()
  var active = []
  for (var i = 0; i < books.length; i++) {
    if (!books[i].deletedAt) {
      active.push(books[i])
    }
  }
  return active
}

function getDeletedBooks() {
  var books = loadBooks()
  var deleted = []
  for (var i = 0; i < books.length; i++) {
    if (books[i].deletedAt) {
      deleted.push(books[i])
    }
  }
  return deleted
}

function addBook(bookData) {
  var books = loadBooks()
  var newBook = {
    id: 'book_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    title: bookData.title.trim(),
    author: bookData.author.trim(),
    pages: parseInt(bookData.pages),
    tag: bookData.tag.trim(),
    dateAdded: bookData.dateAdded,
    isbn: bookData.isbn ? bookData.isbn.trim() : undefined,
    notes: bookData.notes ? bookData.notes.trim() : '',
    favorite: !!bookData.favorite,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deletedAt: null
  }
  books.push(newBook)
  saveBooks(books)
  return newBook
}

function updateBook(id, bookData) {
  var books = loadBooks()
  var index = -1
  for (var i = 0; i < books.length; i++) {
    if (books[i].id == id) {
      index = i
      break
    }
  }
  if (index == -1) return null

  var currentBook = books[index]
  currentBook.title = bookData.title.trim()
  currentBook.author = bookData.author.trim()
  currentBook.pages = parseInt(bookData.pages)
  currentBook.tag = bookData.tag.trim()
  currentBook.dateAdded = bookData.dateAdded
  currentBook.isbn = bookData.isbn ? bookData.isbn.trim() : undefined
  currentBook.notes = bookData.notes ? bookData.notes.trim() : ''
  currentBook.updatedAt = new Date().toISOString()

  books[index] = currentBook
  saveBooks(books)
  return currentBook
}

function toggleFavorite(id) {
  var books = loadBooks()
  var index = -1
  for (var i = 0; i < books.length; i++) {
    if (books[i].id == id) {
      index = i
      break
    }
  }
  if (index == -1) return null
  
  books[index].favorite = !books[index].favorite
  books[index].updatedAt = new Date().toISOString()
  saveBooks(books)
  return books[index].favorite
}

function softDeleteBook(id) {
  var books = loadBooks()
  var index = -1
  for (var i = 0; i < books.length; i++) {
    if (books[i].id == id) {
      index = i
      break
    }
  }
  if (index == -1) return false

  books[index].deletedAt = new Date().toISOString()
  books[index].updatedAt = new Date().toISOString()
  saveBooks(books)
  return true
}

function restoreBook(id) {
  var books = loadBooks()
  var index = -1
  for (var i = 0; i < books.length; i++) {
    if (books[i].id == id) {
      index = i
      break
    }
  }
  if (index == -1) return false

  books[index].deletedAt = null
  books[index].updatedAt = new Date().toISOString()
  saveBooks(books)
  return true
}

function permanentlyDeleteBook(id) {
  var books = loadBooks()
  var index = -1
  for (var i = 0; i < books.length; i++) {
    if (books[i].id == id) {
      index = i
      break
    }
  }
  if (index == -1) return false

  books.splice(index, 1)
  saveBooks(books)
  return true
}

function purgeOldDeletedBooks() {
  var books = loadBooks()
  var SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000
  var now = Date.now()
  var kept = []
  for (var i = 0; i < books.length; i++) {
    var book = books[i]
    if (!book.deletedAt) {
      kept.push(book)
    } else {
      var deletedTime = new Date(book.deletedAt).getTime()
      if ((now - deletedTime) < SEVEN_DAYS_MS) {
        kept.push(book)
      }
    }
  }
  saveBooks(kept)
}

function resetToSeedData(seedData) {
  saveBooks(seedData)
}

function getGoal() {
  var val = localStorage.getItem('vault:goal')
  if (val == null) return 1000
  return parseInt(val)
}
function setGoal(val) {
  localStorage.setItem('vault:goal', String(parseInt(val) || 0))
}

function getUnit() {
  var val = localStorage.getItem('vault:unit')
  if (val == null) return 'pages'
  return val
}
function setUnit(val) {
  localStorage.setItem('vault:unit', val)
}

function getPace() {
  var val = localStorage.getItem('vault:pace')
  if (val == null) return 2
  return parseFloat(val)
}
function setPace(val) {
  localStorage.setItem('vault:pace', String(val))
}

function initState() {
  purgeOldDeletedBooks()
}

function escapeHtml(text) {
  if (!text) return ''
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function compileRegex(input, flags) {
  if (!input) return null
  try {
    return new RegExp(input, flags || 'i')
  } catch (e) {
    return null
  }
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function highlight(text, re) {
  var safeText = escapeHtml(text)
  if (!re) return safeText
  try {
    return safeText.replace(re, function(match) {
      return '<mark>' + match + '</mark>'
    })
  } catch (e) {
    return safeText
  }
}

function matchesSearch(book, re) {
  if (!re) return true
  if (re.test(book.title)) return true
  if (re.test(book.author)) return true
  if (re.test(book.tag)) return true
  if (book.isbn && re.test(book.isbn)) return true
  return false
}

function getSortedFilteredBooks(books) {
  var list = []
  for (var i = 0; i < books.length; i++) {
    list.push(books[i])
  }

  var parts = sortOption.split('-')
  var field = parts[0]
  var direction = parts[1]

  list.sort(function(a, b) {
    var valA = a[field]
    var valB = b[field]

    if (field == 'pages') {
      if (direction == 'asc') {
        return valA - valB
      } else {
        return valB - valA
      }
    }

    valA = String(valA).toLowerCase()
    valB = String(valB).toLowerCase()

    if (valA < valB) {
      return direction == 'asc' ? -1 : 1
    }
    if (valA > valB) {
      return direction == 'asc' ? 1 : -1
    }
    return 0
  })

  return list
}

function validateImportJson(jsonText) {
  try {
    var data = JSON.parse(jsonText)
    if (!Array.isArray(data)) {
      return { valid: false, error: 'Imported file must contain a list of records.' }
    }
    var validated = []
    for (var i = 0; i < data.length; i++) {
      var item = data[i]
      if (!item.title || typeof item.title !== 'string') {
        return { valid: false, error: 'Record at index ' + i + ' has an invalid or missing "title" field.' }
      }
      if (!item.author || typeof item.author !== 'string') {
        return { valid: false, error: 'Record at index ' + i + ' has an invalid or missing "author" field.' }
      }
      var pages = Number(item.pages)
      if (isNaN(pages) || pages <= 0 || !Number.isInteger(pages)) {
        return { valid: false, error: 'Record at index ' + i + ' ("' + item.title + '") must have a positive integer value for "pages".' }
      }
      if (!item.tag || typeof item.tag !== 'string') {
        return { valid: false, error: 'Record at index ' + i + ' ("' + item.title + '") has an invalid or missing "tag" field.' }
      }
      var dateRegex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/
      if (!item.dateAdded || !dateRegex.test(item.dateAdded)) {
        return { valid: false, error: 'Record at index ' + i + ' ("' + item.title + '") must contain a "dateAdded" in format YYYY-MM-DD.' }
      }
      var cleanObj = {
        id: item.id || 'book_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        title: item.title.trim(),
        author: item.author.trim(),
        pages: pages,
        tag: item.tag.trim(),
        dateAdded: item.dateAdded,
        isbn: item.isbn ? String(item.isbn).trim() : undefined,
        notes: item.notes ? String(item.notes).trim() : '',
        favorite: !!item.favorite,
        createdAt: item.createdAt || new Date().toISOString(),
        updatedAt: item.updatedAt || new Date().toISOString(),
        deletedAt: item.deletedAt || null
      }
      validated.push(cleanObj)
    }
    return { valid: true, data: validated }
  } catch (e) {
    return { valid: false, error: 'Malformed JSON: Unable to parse backup file.' }
  }
}

function loadActivities() {
  try {
    var raw = localStorage.getItem('vault:activities')
    if (raw == null) {
      activities = [{ id: 'init', timestamp: new Date().toISOString(), action: 'System Init', details: 'Database log started' }]
    } else {
      activities = JSON.parse(raw)
    }
  } catch (e) {
    activities = []
  }
}

function saveActivities() {
  localStorage.setItem('vault:activities', JSON.stringify(activities))
}

function logActivity(action, details) {
  var log = {
    id: 'act_' + Date.now(),
    timestamp: new Date().toISOString(),
    action: action,
    details: details
  }
  activities.unshift(log)
  if (activities.length > 20) {
    activities.pop()
  }
  saveActivities()
}

function initUI() {
  loadActivities()
  setupNavigation()
  setupFormValidation()
  setupSearchAndSort()
  setupDashboardControls()
  setupSettingsControls()
  renderAll()
}

function renderAll() {
  var activeBooks = getActiveBooks()
  renderDashboard(activeBooks)
  renderBooksList(activeBooks)
  renderRecycleBin()
}

function setupNavigation() {
  var navBtns = document.querySelectorAll('.nav-item')
  for (var i = 0; i < navBtns.length; i++) {
    (function(btn) {
      btn.addEventListener('click', function() {
        var target = btn.getAttribute('data-target')
        switchTab(target)
      })
    })(navBtns[i])
  }

  var mobileMenuBtn = document.getElementById('mobile-menu-btn')
  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', function(e) {
      e.stopPropagation()
      var appSidebar = document.getElementById('app-sidebar')
      var expanded = mobileMenuBtn.getAttribute('aria-expanded') == 'true'
      mobileMenuBtn.setAttribute('aria-expanded', !expanded)
      if (appSidebar) {
        appSidebar.classList.toggle('menu-open')
      }
    })
  }

  var mobileNavStrip = document.getElementById('mobile-nav-strip')
  if (mobileNavStrip) {
    mobileNavStrip.addEventListener('click', function() {
      var appSidebar = document.getElementById('app-sidebar')
      if (appSidebar) {
        appSidebar.classList.toggle('menu-open')
      }
    })
  }

  document.addEventListener('click', function(e) {
    if (window.innerWidth < 768) {
      var appSidebar = document.getElementById('app-sidebar')
      var mobileMenuBtn = document.getElementById('mobile-menu-btn')
      if (appSidebar && !appSidebar.contains(e.target) && mobileMenuBtn && !mobileMenuBtn.contains(e.target)) {
        appSidebar.classList.remove('menu-open')
        mobileMenuBtn.setAttribute('aria-expanded', 'false')
      }
    }
  })

  var closeNotesBtn = document.getElementById('close-notes-drawer-btn')
  if (closeNotesBtn) {
    closeNotesBtn.addEventListener('click', function() {
      var notesDrawer = document.getElementById('notes-overlay-drawer')
      if (notesDrawer) {
        notesDrawer.classList.remove('open')
      }
    })
  }
}

function switchTab(sectionId) {
  var navBtns = document.querySelectorAll('.nav-item')
  for (var i = 0; i < navBtns.length; i++) {
    if (navBtns[i].getAttribute('data-target') == sectionId) {
      navBtns[i].classList.add('active')
    } else {
      navBtns[i].classList.remove('active')
    }
  }

  var sections = document.querySelectorAll('.tab-section')
  for (var j = 0; j < sections.length; j++) {
    if (sections[j].id == sectionId) {
      sections[j].classList.add('active')
    } else {
      sections[j].classList.remove('active')
    }
  }

  activeTab = sectionId
  
  var mainContent = document.getElementById('main-content')
  if (mainContent) {
    mainContent.focus()
  }

  var appSidebar = document.getElementById('app-sidebar')
  var mobileMenuBtn = document.getElementById('mobile-menu-btn')
  if (appSidebar) {
    appSidebar.classList.remove('menu-open')
  }
  if (mobileMenuBtn) {
    mobileMenuBtn.setAttribute('aria-expanded', 'false')
  }

  if (sectionId == 'add-section' && !editingId) {
    var formHeading = document.getElementById('form-heading')
    if (formHeading) formHeading.textContent = "Tell us about this book"
    var formSubmitBtn = document.getElementById('form-submit-btn')
    if (formSubmitBtn) formSubmitBtn.textContent = "Save book"
    var bookForm = document.getElementById('book-form')
    if (bookForm) bookForm.reset()
    clearFormValidity()
  }
}

function setupFormValidation() {
  var fields = [
    { id: 'form-title', validate: validateTitle },
    { id: 'form-author', validate: validateAuthor },
    { id: 'form-pages', validate: validatePages },
    { id: 'form-date', validate: validateDate },
    { id: 'form-tag', validate: validateTag },
    { id: 'form-isbn', validate: validateIsbn }
  ]

  for (var i = 0; i < fields.length; i++) {
    (function(field) {
      var el = document.getElementById(field.id)
      if (!el) return

      var check = function() {
        var val = el.value
        var isValid = field.validate(val)
        if (isValid) {
          el.classList.add('valid')
          el.classList.remove('invalid')
        } else {
          el.classList.add('invalid')
          el.classList.remove('valid')
        }

        if (field.id == 'form-title') {
          var warning = document.getElementById('duplicate-word-warning')
          if (warning) {
            if (hasDuplicateWords(val)) {
              var doubleWord = getDuplicateWord(val)
              warning.textContent = 'Warning: Repeated word "' + doubleWord + '" detected.'
              warning.style.display = 'block'
            } else {
              warning.style.display = 'none'
            }
          }
        }
      }

      el.addEventListener('blur', check)
      el.addEventListener('input', check)
    })(fields[i])
  }

  var cancelBtn = document.getElementById('form-cancel-btn')
  if (cancelBtn) {
    cancelBtn.addEventListener('click', function() {
      var bookForm = document.getElementById('book-form')
      if (bookForm) bookForm.reset()
      clearFormValidity()
      switchTab('books-section')
    })
  }

  var bookForm = document.getElementById('book-form')
  if (bookForm) {
    bookForm.addEventListener('submit', function(e) {
      e.preventDefault()

      var formIsValid = true
      for (var i = 0; i < fields.length; i++) {
        var el = document.getElementById(fields[i].id)
        if (el) {
          var isValid = fields[i].validate(el.value)
          if (!isValid) {
            el.classList.add('invalid')
            el.classList.remove('valid')
            formIsValid = false
          }
        }
      }

      if (!formIsValid) {
        announceA11yMessage("Form validation errors. Please check red fields.")
        return
      }

      var bookData = {
        title: document.getElementById('form-title').value,
        author: document.getElementById('form-author').value,
        pages: document.getElementById('form-pages').value,
        dateAdded: document.getElementById('form-date').value,
        tag: document.getElementById('form-tag').value,
        isbn: document.getElementById('form-isbn').value,
        notes: document.getElementById('form-notes').value
      }

      var editId = document.getElementById('edit-book-id').value
      if (editId) {
        updateBook(editId, bookData)
        logActivity('Book Updated', 'Modified details for "' + bookData.title + '"')
        announceA11yMessage('Book "' + bookData.title + '" updated successfully.')
      } else {
        addBook(bookData)
        logActivity('Book Added', 'Added "' + bookData.title + '" to ' + bookData.tag)
        announceA11yMessage('Book "' + bookData.title + '" added to your vault.')
      }

      bookForm.reset()
      clearFormValidity()
      renderAll()
      switchTab('books-section')
    })
  }
}

function clearFormValidity() {
  editingId = ''
  var editBookId = document.getElementById('edit-book-id')
  if (editBookId) editBookId.value = ''
  
  var ids = ['form-title', 'form-author', 'form-pages', 'form-date', 'form-tag', 'form-isbn']
  for (var i = 0; i < ids.length; i++) {
    var el = document.getElementById(ids[i])
    if (el) {
      el.classList.remove('valid')
      el.classList.remove('invalid')
    }
  }
  var notes = document.getElementById('form-notes')
  if (notes) notes.value = ''
  var warning = document.getElementById('duplicate-word-warning')
  if (warning) warning.style.display = 'none'
}

function fillFormForEdit(book) {
  var formHeading = document.getElementById('form-heading')
  if (formHeading) formHeading.textContent = "Edit book details"
  
  var formSubmitBtn = document.getElementById('form-submit-btn')
  if (formSubmitBtn) formSubmitBtn.textContent = "Update details"

  editingId = book.id
  var editBookId = document.getElementById('edit-book-id')
  if (editBookId) editBookId.value = book.id

  document.getElementById('form-title').value = book.title
  document.getElementById('form-author').value = book.author
  document.getElementById('form-pages').value = book.pages
  document.getElementById('form-date').value = book.dateAdded
  document.getElementById('form-tag').value = book.tag
  document.getElementById('form-isbn').value = book.isbn || ''
  document.getElementById('form-notes').value = book.notes || ''

  var ids = ['form-title', 'form-author', 'form-pages', 'form-date', 'form-tag']
  for (var i = 0; i < ids.length; i++) {
    var el = document.getElementById(ids[i])
    if (el) el.classList.add('valid')
  }
  var isbnEl = document.getElementById('form-isbn')
  if (isbnEl && book.isbn) isbnEl.classList.add('valid')

  switchTab('add-section')
}

function setupSearchAndSort() {
  var handleQueryChange = function() {
    var searchInput = document.getElementById('search-input')
    if (!searchInput) return
    var query = searchInput.value.trim()
    searchQuery = query

    var regexEnabled = document.getElementById('search-regex-toggle').checked
    var caseInsensitive = document.getElementById('search-case-toggle').checked
    
    searchRegexEnabled = regexEnabled
    searchCaseInsensitive = caseInsensitive

    if (query) {
      if (regexEnabled) {
        var compiled = compileRegex(query, caseInsensitive ? 'i' : '')
        if (compiled) {
          compiledSearchRegex = compiled
          searchInput.classList.remove('invalid')
        } else {
          compiledSearchRegex = null
          searchInput.classList.add('invalid')
        }
      } else {
        var escapedQuery = escapeRegExp(query)
        compiledSearchRegex = compileRegex(escapedQuery, caseInsensitive ? 'i' : '')
        searchInput.classList.remove('invalid')
      }
    } else {
      compiledSearchRegex = null
      searchInput.classList.remove('invalid')
    }

    renderBooksList(getActiveBooks())
  }

  var searchInput = document.getElementById('search-input')
  if (searchInput) {
    searchInput.addEventListener('input', handleQueryChange)
  }
  var searchRegexToggle = document.getElementById('search-regex-toggle')
  if (searchRegexToggle) {
    searchRegexToggle.addEventListener('change', handleQueryChange)
  }
  var searchCaseToggle = document.getElementById('search-case-toggle')
  if (searchCaseToggle) {
    searchCaseToggle.addEventListener('change', handleQueryChange)
  }

  var sortSelect = document.getElementById('sort-select')
  if (sortSelect) {
    sortSelect.addEventListener('change', function() {
      sortOption = sortSelect.value
      renderBooksList(getActiveBooks())
    })
  }
}

function renderBooksList(books) {
  var filtered = []
  for (var i = 0; i < books.length; i++) {
    if (compiledSearchRegex) {
      if (matchesSearch(books[i], compiledSearchRegex)) {
        filtered.push(books[i])
      }
    } else {
      filtered.push(books[i])
    }
  }

  var sorted = getSortedFilteredBooks(filtered)
  var tbody = document.getElementById('books-table-body')
  if (!tbody) return

  tbody.innerHTML = ''
  if (sorted.length == 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-muted); font-style: italic; padding: 24px;">No matching records found</td></tr>'
  } else {
    for (var j = 0; j < sorted.length; j++) {
      (function(book) {
        var row = document.createElement('tr')
        row.className = 'soft-fade'
        
        var titleMarkup = highlight(book.title, compiledSearchRegex)
        var authorMarkup = highlight(book.author, compiledSearchRegex)
        var tagMarkup = highlight(book.tag, compiledSearchRegex)
        var coverColor = generateHslColor(book.title + book.author)

        row.innerHTML = '<td><span class="table-book-cover-meta" style="background-color: ' + coverColor + ';"></span>' + titleMarkup + '</td>' +
          '<td>by ' + authorMarkup + '</td>' +
          '<td class="pages-cell">' + book.pages + '</td>' +
          '<td><span class="status-pill active">' + tagMarkup + '</span></td>' +
          '<td><span class="ui-small" style="font-family: var(--font-mono);">' + book.dateAdded + '</span></td>' +
          '<td style="text-align: right;">' +
            '<div style="display: flex; gap: 8px; justify-content: flex-end;">' +
              '<button class="btn-icon view-notes-btn" title="View Notes" aria-label="View notes for ' + escapeHtml(book.title) + '">' +
                '<svg viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>' +
              '</button>' +
              '<button class="btn-icon edit-btn" aria-label="Edit details for ' + escapeHtml(book.title) + '">' +
                '<svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>' +
              '</button>' +
              '<button class="btn-icon delete-btn" aria-label="Move ' + escapeHtml(book.title) + ' to recycle bin">' +
                '<svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>' +
              '</button>' +
            '</div>' +
          '</td>'

        row.querySelector('.edit-btn').addEventListener('click', function() {
          fillFormForEdit(book)
        })
        row.querySelector('.delete-btn').addEventListener('click', function() {
          if (confirm('Move "' + book.title + '" to the Recycle Bin?')) {
            softDeleteBook(book.id)
            logActivity('Book Deleted', 'Moved "' + book.title + '" to Recycle Bin')
            announceA11yMessage('"' + book.title + '" was moved to the recycle bin.')
            renderAll()
          }
        })
        row.querySelector('.view-notes-btn').addEventListener('click', function() {
          var drawerContent = document.getElementById('notes-drawer-content')
          var drawerTitle = document.getElementById('notes-drawer-title')
          var notesDrawer = document.getElementById('notes-overlay-drawer')
          if (drawerContent) drawerContent.textContent = book.notes || "No notes recorded for this book yet."
          if (drawerTitle) drawerTitle.textContent = "Ledger Notes: " + book.title
          if (notesDrawer) notesDrawer.classList.add('open')
        })

        tbody.appendChild(row)
      })(sorted[j])
    }
  }
}

function setupDashboardControls() {
  var goalInput = document.getElementById('monthly-goal-input')
  if (goalInput) {
    goalInput.addEventListener('input', function() {
      var val = parseInt(goalInput.value)
      if (isNaN(val) || val <= 0) val = 1000
      setGoal(val)
      renderAll()
    })
  }
}

function renderDashboard(books) {
  var totalBooks = books.length
  var totalPages = 0
  for (var i = 0; i < books.length; i++) {
    totalPages += books[i].pages
  }

  var currentUnit = getUnit()
  var pace = getPace()

  var statPagesLabel = document.getElementById('stat-pages-label')
  var statPagesCount = document.getElementById('stat-pages-count')
  if (currentUnit == 'minutes') {
    if (statPagesLabel) statPagesLabel.textContent = "Minutes Read"
    var totalMinutes = Math.round(totalPages * pace)
    if (statPagesCount) statPagesCount.textContent = totalMinutes
  } else {
    if (statPagesLabel) statPagesLabel.textContent = "Pages Read"
    if (statPagesCount) statPagesCount.textContent = totalPages
  }

  var statBooksCount = document.getElementById('stat-books-count')
  var statBooksBadge = document.getElementById('stat-books-badge')
  if (statBooksCount) statBooksCount.textContent = totalBooks
  if (statBooksBadge) statBooksBadge.textContent = '+' + totalBooks

  var statPagesBadge = document.getElementById('stat-pages-badge')
  if (statPagesBadge) statPagesBadge.textContent = '+' + totalPages

  var tagCounts = {}
  for (var j = 0; j < books.length; j++) {
    var tag = books[j].tag
    if (tagCounts[tag] == null) {
      tagCounts[tag] = 0
    }
    tagCounts[tag] += 1
  }
  var favoriteTag = '-'
  var maxCount = 0
  for (var tagKey in tagCounts) {
    if (tagCounts[tagKey] > maxCount) {
      maxCount = tagCounts[tagKey]
      favoriteTag = tagKey
    }
  }
  var statFavoriteTag = document.getElementById('stat-favorite-tag')
  if (statFavoriteTag) statFavoriteTag.textContent = favoriteTag

  var goal = getGoal()
  var monthlyGoalInput = document.getElementById('monthly-goal-input')
  if (monthlyGoalInput) monthlyGoalInput.value = goal
  var goalUnitText = document.getElementById('goal-unit-text')
  if (goalUnitText) goalUnitText.textContent = currentUnit

  var targetProgress = totalPages
  if (currentUnit == 'minutes') {
    targetProgress = Math.round(totalPages * pace)
  }

  var percentage = goal > 0 ? Math.round((targetProgress / goal) * 100) : 0
  var statGoalPercentage = document.getElementById('stat-goal-percentage')
  if (statGoalPercentage) statGoalPercentage.textContent = percentage + '%'
  
  var statGoalBadge = document.getElementById('stat-goal-badge')
  var goalStatusAnnouncer = document.getElementById('goal-status-announcer')
  var dashboardProgressText = document.getElementById('dashboard-progress-text')

  if (percentage >= 100) {
    if (statGoalBadge) {
      statGoalBadge.textContent = "Achieved"
      statGoalBadge.className = "card-trend-badge badge-up"
    }
    if (goalStatusAnnouncer) {
      goalStatusAnnouncer.className = 'goal-text-alert alert-exceeded'
      goalStatusAnnouncer.textContent = 'Goal reached! Progress: ' + targetProgress + '/' + goal + ' ' + currentUnit
      goalStatusAnnouncer.setAttribute('role', 'alert')
    }
    if (dashboardProgressText) {
      dashboardProgressText.textContent = "You've achieved 100% of your reading goal this month. Excellent work!"
    }
  } else {
    if (statGoalBadge) {
      statGoalBadge.textContent = "Pending"
      statGoalBadge.className = "card-trend-badge badge-alert"
    }
    if (goalStatusAnnouncer) {
      goalStatusAnnouncer.className = 'goal-text-alert alert-normal'
      goalStatusAnnouncer.textContent = 'Goal progress: ' + targetProgress + ' / ' + goal + ' ' + currentUnit
      goalStatusAnnouncer.setAttribute('role', 'status')
    }
    if (dashboardProgressText) {
      dashboardProgressText.textContent = "You're at " + percentage + "% of your reading goal this month, almost there."
    }
  }

  var goalDonutFill = document.getElementById('goal-donut-fill')
  var donutPercentageLabel = document.getElementById('donut-percentage-label')
  if (goalDonutFill) {
    var r = 55
    var c = 2 * Math.PI * r
    var displayPercentage = Math.min(percentage, 100)
    var strokeOffset = c - (c * displayPercentage) / 100
    goalDonutFill.style.strokeDashoffset = strokeOffset
  }
  if (donutPercentageLabel) {
    donutPercentageLabel.textContent = percentage + '%'
  }

  var readingTimePrediction = document.getElementById('reading-time-prediction')
  if (readingTimePrediction) {
    var estHours = Math.floor((totalPages * pace) / 60)
    var estMins = Math.round((totalPages * pace) % 60)
    readingTimePrediction.textContent = estHours + 'h ' + estMins + 'm'
  }

  renderWeeklyChart(books, currentUnit, pace)
  renderCategoryProgressSplits(books, totalBooks)
  renderRecentActivityLogWidget()
  renderRecentDashboardTable(books)
}

function renderWeeklyChart(books, unit, pace) {
  var weeklyChart = document.getElementById('weekly-chart')
  if (!weeklyChart) return
  weeklyChart.innerHTML = ''
  
  var dailyData = []
  var daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  var today = new Date()
  
  for (var i = 6; i >= 0; i--) {
    var d = new Date()
    d.setDate(today.getDate() - i)
    var dateStr = d.toISOString().split('T')[0]
    var dayName = daysOfWeek[d.getDay()]
    
    var dailySum = 0
    for (var j = 0; j < books.length; j++) {
      if (books[j].dateAdded == dateStr) {
        dailySum += books[j].pages
      }
    }

    if (unit == 'minutes') {
      dailySum = Math.round(dailySum * pace)
    }
    
    dailyData.push({ dayName: dayName, dateStr: dateStr, value: dailySum })
  }

  var maxVal = 10
  for (var k = 0; k < dailyData.length; k++) {
    if (dailyData[k].value > maxVal) {
      maxVal = dailyData[k].value
    }
  }

  for (var n = 0; n < dailyData.length; n++) {
    var day = dailyData[n]
    var col = document.createElement('div')
    col.className = 'chart-bar-container'
    var barHeight = Math.round((day.value / maxVal) * 80)
    
    col.innerHTML = '<div class="chart-bar" style="height: ' + Math.max(4, barHeight) + 'px;" data-value="' + day.value + '" tabindex="0" aria-label="' + day.value + ' ' + unit + ' read on ' + day.dayName + '"></div>' +
      '<div class="chart-label">' + day.dayName + '</div>'
    weeklyChart.appendChild(col)
  }
}

function renderCategoryProgressSplits(books, totalBooks) {
  var container = document.getElementById('category-distribution-container')
  if (!container) return
  container.innerHTML = ''

  if (totalBooks == 0) {
    container.innerHTML = '<p class="ui-small" style="color: var(--text-muted); font-style: italic;">No books logged in catalog</p>'
    return
  }

  var splits = {}
  for (var i = 0; i < books.length; i++) {
    var tag = books[i].tag
    if (splits[tag] == null) {
      splits[tag] = 0
    }
    splits[tag] += 1
  }

  var sortedSplits = []
  for (var key in splits) {
    sortedSplits.push([key, splits[key]])
  }
  sortedSplits.sort(function(a, b) {
    return b[1] - a[1]
  })

  for (var j = 0; j < sortedSplits.length; j++) {
    var split = sortedSplits[j]
    var tag = split[0]
    var count = split[1]
    var pct = Math.round((count / totalBooks) * 100)
    var color = generateHslColor(tag)
    
    var row = document.createElement('div')
    row.className = 'category-progress-row'
    row.innerHTML = '<div class="category-progress-label-bar">' +
        '<span>' + escapeHtml(tag) + '</span>' +
        '<span style="color: var(--text-muted);">' + count + ' books (' + pct + '%)</span>' +
      '</div>' +
      '<div class="category-progress-bar-container">' +
        '<div class="category-progress-bar-fill" style="width: ' + pct + '%; background-color: ' + color + ';"></div>' +
      '</div>'
    container.appendChild(row)
  }
}

function renderRecentActivityLogWidget() {
  var container = document.getElementById('recent-activities-list')
  if (!container) return
  container.innerHTML = ''

  if (activities.length == 0) {
    container.innerHTML = '<div style="font-size: 12px; color: var(--text-muted); font-style: italic;">No activity logs recorded</div>'
    return
  }

  for (var i = 0; i < activities.length; i++) {
    var log = activities[i]
    var item = document.createElement('div')
    item.className = 'activity-log-item'
    
    var dateObj = new Date(log.timestamp)
    var timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    var dateStr = dateObj.toLocaleDateString([], { month: 'short', day: '2-digit' })

    item.innerHTML = '<strong>' + escapeHtml(log.action) + '</strong>: ' + escapeHtml(log.details) +
      '<span class="activity-log-time">' + dateStr + ' &bull; ' + timeStr + '</span>'
    container.appendChild(item)
  }
}

function renderRecentDashboardTable(books) {
  var container = document.getElementById('dashboard-recent-table-body')
  if (!container) return
  container.innerHTML = ''
  
  var recent = []
  for (var i = 0; i < books.length; i++) {
    recent.push(books[i])
  }
  recent.sort(function(a, b) {
    return b.dateAdded.localeCompare(a.dateAdded)
  })
  recent = recent.slice(0, 4)

  if (recent.length == 0) {
    container.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--text-muted); font-style: italic; padding: 12px;">No additions logged in catalog</td></tr>'
    return
  }

  for (var j = 0; j < recent.length; j++) {
    var book = recent[j]
    var row = document.createElement('tr')
    var coverColor = generateHslColor(book.title + book.author)

    row.innerHTML = '<td class="book-title-cell" style="padding: 10px 16px;">' +
        '<span class="table-book-cover-meta" style="background-color: ' + coverColor + ';"></span>' +
        escapeHtml(book.title) +
      '</td>' +
      '<td style="padding: 10px 16px;">' + book.pages + ' pgs</td>' +
      '<td style="padding: 10px 16px;"><span class="status-pill active">' + escapeHtml(book.tag) + '</span></td>' +
      '<td style="text-align: right; padding: 10px 16px; font-family: var(--font-mono); font-size: 11px;">' + book.dateAdded + '</td>'
    container.appendChild(row)
  }
}

function generateHslColor(str) {
  var hash = 0
  for (var i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  var hue = Math.abs(hash % 360)
  var saturation = 55 + Math.abs(hash % 20)
  var lightness = 40 + Math.abs(hash % 15)
  return 'hsl(' + hue + ', ' + saturation + '%, ' + lightness + '%)'
}

function setupSettingsControls() {
  var unitSelect = document.getElementById('setting-unit-select')
  if (unitSelect) {
    unitSelect.addEventListener('change', function() {
      var val = unitSelect.value
      setUnit(val)
      logActivity('Setting Changed', 'Reading metrics measured in ' + val)
      renderAll()
    })
    unitSelect.value = getUnit()
  }

  var paceInput = document.getElementById('setting-pace-input')
  if (paceInput) {
    paceInput.addEventListener('input', function() {
      var val = parseFloat(paceInput.value)
      if (isNaN(val) || val <= 0.1) val = 2
      setPace(val)
      renderAll()
    })
    paceInput.value = getPace()
  }

  var exportBtn = document.getElementById('export-db-btn')
  if (exportBtn) {
    exportBtn.addEventListener('click', function() {
      var payload = getActiveBooks()
      var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(payload, null, 2))
      var downloadAnchor = document.createElement('a')
      downloadAnchor.setAttribute("href", dataStr)
      downloadAnchor.setAttribute("download", "backup-" + new Date().toISOString().split('T')[0] + ".json")
      document.body.appendChild(downloadAnchor)
      downloadAnchor.click()
      downloadAnchor.remove()
      logActivity('Backup Exported', 'Downloaded backup JSON package')
      announceA11yMessage("Database backup exported successfully.")
    })
  }

  var importTrigger = document.getElementById('import-trigger-btn')
  var importFile = document.getElementById('import-db-file')
  if (importTrigger && importFile) {
    importTrigger.addEventListener('click', function() {
      importFile.click()
    })

    importFile.addEventListener('change', function(e) {
      var file = e.target.files[0]
      if (!file) return

      var reader = new FileReader()
      reader.onload = function(event) {
        var result = validateImportJson(event.target.result)
        if (result.valid) {
          if (confirm('Successfully parsed ' + result.data.length + ' records. Overwrite your active vault?')) {
            resetToSeedData(result.data)
            logActivity('Database Imported', 'Restored database file containing ' + result.data.length + ' records')
            renderAll()
            announceA11yMessage("Database successfully imported and restored.")
          }
        } else {
          alert('Failed to import backup:\n' + result.error)
          announceA11yMessage('Import failure: ' + result.error)
        }
        importFile.value = ''
      }
      reader.readAsText(file)
    })
  }

  var resetBtn = document.getElementById('reset-seed-btn')
  if (resetBtn) {
    resetBtn.addEventListener('click', function() {
      if (confirm("Are you sure you want to delete all current data and reset back to the default seed books?")) {
        fetch('seed.json')
          .then(function(res) {
            return res.json()
          })
          .then(function(data) {
            resetToSeedData(data)
            logActivity('Vault Reset', 'Restored default baseline seed records')
            renderAll()
            announceA11yMessage("Vault restored to default seed catalog.")
            alert("Vault restored to default sample dataset.")
          })
          .catch(function(err) {
            alert("Failed to load local seed.json data.")
          })
      }
    })
  }
}

function renderRecycleBin() {
  var deletedBooks = getDeletedBooks()
  var container = document.getElementById('recycle-bin-container')
  if (!container) return
  container.innerHTML = ''
  
  if (deletedBooks.length == 0) {
    var emptyText = document.createElement('p')
    emptyText.id = 'recycle-empty-text'
    emptyText.className = 'ui-text'
    emptyText.style.cssText = 'color: var(--text-muted); font-style: italic;'
    emptyText.textContent = 'Recycle bin is empty'
    container.appendChild(emptyText)
  } else {
    for (var i = 0; i < deletedBooks.length; i++) {
      (function(book) {
        var row = document.createElement('div')
        row.className = 'soft-fade'
        row.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; border: 1px solid var(--divider); background-color: #F8F9FA; margin-bottom: 5px;'
        
        row.innerHTML = '<div>' +
            '<span style="font-family: var(--font-sans); font-size: 13px; font-weight: 600;">' + escapeHtml(book.title) + '</span>' +
            '<span class="ui-small" style="color: var(--text-muted); margin-left: 6px;">by ' + escapeHtml(book.author) + '</span>' +
          '</div>' +
          '<div style="display: flex; gap: 8px;">' +
            '<button class="btn btn-secondary restore-btn" style="height: 24px; padding: 0 8px; font-size: 11px;">restore</button>' +
            '<button class="btn btn-secondary delete-permanent-btn" style="height: 24px; padding: 0 8px; font-size: 11px; border-color: var(--accent-orange); color: var(--accent-orange);">delete</button>' +
          '</div>'

        row.querySelector('.restore-btn').addEventListener('click', function() {
          restoreBook(book.id)
          logActivity('Book Restored', 'Restored "' + book.title + '" to active catalog')
          announceA11yMessage('"' + book.title + '" has been restored to bookshelf.')
          renderAll()
        })

        row.querySelector('.delete-permanent-btn').addEventListener('click', function() {
          if (confirm('Permanently erase "' + book.title + '"? This cannot be undone.')) {
            permanentlyDeleteBook(book.id)
            logActivity('Book Purged', 'Permanently deleted "' + book.title + '"')
            announceA11yMessage('"' + book.title + '" was permanently purged.')
            renderAll()
          }
        })

        container.appendChild(row)
      })(deletedBooks[i])
    }
  }
}

function announceA11yMessage(msg) {
  var liveRegion = document.getElementById('goal-status-announcer')
  if (liveRegion) {
    var originalContent = liveRegion.textContent
    liveRegion.textContent = msg
    setTimeout(function() {
      if (liveRegion.textContent == msg) {
        liveRegion.textContent = originalContent
      }
    }, 4500)
  }
}

window.onload = function() {
  console.log('Book Tracker starting...')
  initState()

  var books = getActiveBooks()
  var deletedBooks = getDeletedBooks()

  if (books.length == 0 && deletedBooks.length == 0) {
    fetch('seed.json')
      .then(function(res) {
        return res.json()
      })
      .then(function(data) {
        resetToSeedData(data)
        initState()
        initUI()
      })
      .catch(function(err) {
        initUI()
      })
  } else {
    initUI()
  }
}
