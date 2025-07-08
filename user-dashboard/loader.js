function showLoader() {
    let loader = document.getElementById('loader');
    if (!loader) {
        loader = document.createElement('div');
        loader.id = 'loader';
        loader.className = 'fixed inset-0 z-50 bg-white bg-opacity-80 flex items-center justify-center';
        loader.innerHTML = '<div class="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>';
        document.body.appendChild(loader);
    }
    loader.style.display = 'flex';
    loader.classList.remove('hidden');
    loader.classList.add('flex');
    }

    function hideLoader() {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.style.display = 'none';
        loader.classList.add('hidden');
        loader.classList.remove('flex');
    }
    }
