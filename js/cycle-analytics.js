const ctx = document.getElementById('flowChart').getContext('2d');
new Chart(ctx, {
    type: 'line',
    data: {
        labels: [0, 1, 2, 3, 4, 5],
        datasets: [{
            label: 'Flow Intensity',
            data: [0,2, 3, 2, 2, 1],
            borderColor: '#000000',
            fill: false,
            tension: 0.1
        }]
    },
    options: {
        responsive: true,
        scales: {
            x: {
                title: {
                    display: true,
                    text: 'DAY'
                }
            },
            y: {
                title: {
                    display: true,
                    text: 'Flow Intensity'
                },
                ticks: {
                    callback: function(value) {
                        const labels = ['Low', 'Medium', 'High'];
                        return labels[value - 1];
                    },
                    stepSize: 1,
                    min: 1,
                    max: 3
                }
            }
        },
        plugins: {
            legend: {
                display: false
            }
        }
    }
});

